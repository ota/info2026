package edu.info2026;

import java.io.*;
import java.lang.reflect.InvocationTargetException;
import java.net.URL;
import java.net.URLClassLoader;

/** Browser I/O bridge. Student source is compiled unchanged as Main.java. */
public final class Runner {
    private static native void output(int channel, String text);
    private static native String input();
    private static native void phase(String name);

    private static final class BrowserOutput extends OutputStream {
        private final int channel;
        private final ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        BrowserOutput(int channel) { this.channel = channel; }
        public void write(int value) { buffer.write(value); }
        public void write(byte[] bytes, int offset, int length) {
            buffer.write(bytes, offset, length);
        }
        public void flush() throws IOException {
            if (buffer.size() > 0) {
                output(channel, buffer.toString("UTF-8"));
                buffer.reset();
            }
        }
    }

    private static final class BrowserInput extends InputStream {
        private byte[] bytes = new byte[0];
        private int position;
        private boolean eof;
        private boolean fill() throws IOException {
            if (position < bytes.length) return true;
            if (eof) return false;
            String line = input();
            if (line == null) { eof = true; return false; }
            bytes = (line + "\n").getBytes("UTF-8");
            position = 0;
            return true;
        }
        public int read() throws IOException {
            return fill() ? bytes[position++] & 255 : -1;
        }
        public int read(byte[] target, int offset, int length) throws IOException {
            if (target == null) throw new NullPointerException();
            if (offset < 0 || length < 0 || length > target.length - offset)
                throw new IndexOutOfBoundsException();
            if (length == 0) return 0;
            if (!fill()) return -1;
            int count = Math.min(length, bytes.length - position);
            System.arraycopy(bytes, position, target, offset, count);
            position += count;
            return count;
        }
    }

    public static void main(String[] args) throws Exception {
        System.setOut(new PrintStream(new BrowserOutput(1), true, "UTF-8"));
        System.setErr(new PrintStream(new BrowserOutput(2), true, "UTF-8"));
        System.setIn(new BrowserInput());
        File directory = new File("/files/" + args[0]);
        directory.mkdirs();
        try {
            phase("compile");
            String[] options = {"-encoding", "UTF-8", "-d", directory.getPath(),
                "/str/Main.java"};
            int code = (Integer) Class.forName("com.sun.tools.javac.Main")
                .getMethod("compile", String[].class, PrintWriter.class)
                .invoke(null, options, new PrintWriter(System.err, true));
            if (code != 0) { phase("compile-error"); System.exit(code); }
            phase("run");
            try (URLClassLoader loader = new URLClassLoader(new URL[]{directory.toURI().toURL()})) {
                Class<?> main = loader.loadClass("Main");
                main.getMethod("main", String[].class).invoke(null, (Object) new String[0]);
            }
        } catch (InvocationTargetException error) {
            error.getCause().printStackTrace(System.err);
            System.exit(1);
        } catch (Throwable error) {
            error.printStackTrace(System.err);
            System.exit(1);
        } finally {
            System.out.flush();
            System.err.flush();
            remove(directory);
        }
    }

    private static void remove(File file) {
        File[] children = file.listFiles();
        if (children != null) for (File child : children) remove(child);
        file.delete();
    }
}
