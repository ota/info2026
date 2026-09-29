"""Package our source-built TeaVM compiler, notices and corresponding sources.

Usage: python3 scripts/package-teavm.py UPSTREAM_BUILD_DIR TEAVM_SOURCE_ZIP
The build directory must have compiler:createDist and lessonDependencySources outputs.
"""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import hashlib
import io
import json
import re
import sys

root = Path(__file__).resolve().parent.parent
build = Path(sys.argv[1]).resolve()
teavm_sources = Path(sys.argv[2]).resolve()
target = root / 'public/teavm'
target.mkdir(parents=True, exist_ok=True)
vendor = target / 'vendor'
vendor.mkdir(exist_ok=True)
commit = '2ddcf02e4983e5c74d45b945c2fd41a829358828'
jdk_revision = '6c48f4ed707bf0b15f9b6098de30db8aae6fa40f'
runtime_files = ['compiler.wasm', 'compiler.wasm-runtime.js',
                 'compile-classlib-teavm.bin', 'runtime-classlib-teavm.bin']
with ZipFile(next((build / 'compiler/build/distributions').glob('dist*.zip'))) as archive:
    for name in runtime_files:
        (vendor / name).write_bytes(archive.read(name))

dependencies = json.loads((build / 'lesson-dependencies.json').read_text())
license_texts = []
source_buffer = io.BytesIO()
with ZipFile(source_buffer, 'w', ZIP_DEFLATED) as bundle:
    # All source and build configuration in the compiler project, without caches/build output.
    for path in sorted(build.rglob('*')):
        relative = path.relative_to(build)
        if path.is_file() and not any(part in ('build', '.gradle', '.git', '.idea') for part in relative.parts):
            if path.name != 'lesson-dependencies.json':
                bundle.write(path, f'teavm-javac/{relative}')
    bundle.write(teavm_sources, 'teavm-0.13.1-source.zip')
    with ZipFile(teavm_sources) as archive:
        for name in archive.namelist():
            if not name.endswith('/') and any(token in Path(name).name.lower() for token in ('license', 'notice', 'copying')):
                try:
                    license_texts.append((name, archive.read(name).decode('utf-8')))
                except UnicodeDecodeError:
                    pass
    # These are every OpenJDK source/build-tool directory consumed by javac/build.gradle.
    # Store in the exact upstream ZIP layout so Gradle can rebuild without redownloading JDK sources.
    selected_jdk = io.BytesIO()
    with ZipFile(build / f'javac/build/jdk-{jdk_revision}.zip') as original, \
            ZipFile(selected_jdk, 'w', ZIP_DEFLATED) as subset:
        prefix = f'jdk25u-{jdk_revision}/'
        selected = ('make/langtools/tools/', 'src/jdk.compiler/', 'src/java.compiler/',
                    'src/jdk.internal.opt/', 'src/java.base/share/classes/jdk/internal/jmod/')
        for name in original.namelist():
            relative = name.removeprefix(prefix)
            legal = '/' not in relative and any(token in relative for token in ('LICENSE', 'EXCEPTION'))
            if not name.endswith('/') and (relative.startswith(selected) or legal):
                data = original.read(name)
                subset.writestr(name, data)
                if legal:
                    license_texts.append((f'OpenJDK/{relative}', data.decode('utf-8')))
    bundle.writestr(f'teavm-javac/javac/build/jdk-{jdk_revision}.zip', selected_jdk.getvalue())
    for entry in dependencies:
        coordinate = f"{entry['group']}:{entry['name']}:{entry['version']}"
        bundle.write(entry['sources'], f"dependency-sources/{entry['group']}/{Path(entry['sources']).name}")
        # Several BSD libraries (ASM, JZlib) put their notice in source headers,
        # rather than a separate LICENSE file in the binary JAR.
        seen_headers = set()
        with ZipFile(entry['sources']) as sources:
            for name in sources.namelist():
                if not name.endswith('.java'):
                    continue
                text = sources.read(name).decode('utf-8', errors='replace')
                match = re.match(r'\s*(/\*[\s\S]*?\*/)', text)
                if match and 'copyright' in match[1].lower() and match[1] not in seen_headers:
                    seen_headers.add(match[1])
                    license_texts.append((f'{coordinate}/{name} (source notice)', match[1]))
        with ZipFile(entry['binary']) as binary:
            for name in binary.namelist():
                if not name.endswith('/') and any(token in name.lower() for token in ('license', 'notice', 'copying')):
                    try:
                        license_texts.append((f'{coordinate}/{name}', binary.read(name).decode('utf-8')))
                    except UnicodeDecodeError:
                        pass
    for name in ['teavm-dependencies.init.gradle', 'package-teavm.py']:
        bundle.write(root / 'scripts' / name, f'lesson-build/{name}')
    bundle.write(target / 'SOURCE-BUILD.md', 'SOURCE-BUILD.md')
    inventory = [{key: entry[key] for key in ('group', 'name', 'version')} for entry in dependencies]
    bundle.writestr('dependencies.json', json.dumps(inventory, indent=2) + '\n')
(target / 'sources.zip').write_bytes(source_buffer.getvalue())
(target / 'THIRD-PARTY-LICENSES.txt').write_text('\n\n'.join(
    f'===== {name} =====\n{text}' for name, text in license_texts), encoding='utf-8')
manifest = {
    'compilerSource': f'https://github.com/konsoletyper/teavm-javac/tree/{commit}',
    'teaVMVersion': '0.13.1', 'openJDKRevision': jdk_revision, 'dependencies': inventory,
    'files': {name: hashlib.sha256((vendor / name).read_bytes()).hexdigest() for name in runtime_files},
    'sourcesSha256': hashlib.sha256(source_buffer.getvalue()).hexdigest(),
}
(target / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(f'Runtime: {sum((vendor / name).stat().st_size for name in runtime_files):,} bytes')
print(f'Sources: {(target / "sources.zip").stat().st_size:,} bytes')
