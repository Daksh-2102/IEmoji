import http.server
import socketserver
import os

PORT = int(os.environ.get("PORT", 8080))

class APKHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS for mobile access
        self.send_header('Access-Control-Allow-Origin', '*')
        # Force download for .apk files with content-disposition header
        clean_path = self.path.split('?')[0]
        if clean_path.endswith('.apk'):
            self.send_header('Content-Disposition', 'attachment; filename="iemoji-keyboard.apk"')
        super().end_headers()

    def guess_type(self, path):
        if path.endswith('.apk'):
            return 'application/vnd.android.package-archive'
        return super().guess_type(path)

    def log_message(self, format, *args):
        print(f"[Request] {self.address_string()} - {format % args}")

if __name__ == '__main__':
    print(f"Serving iEmoji Keyboard at http://0.0.0.0:{PORT}")
    print(f"Access from phone at: http://10.119.141.112:{PORT}")
    print(f"Press Ctrl+C to stop the server.\n")

    with socketserver.TCPServer(("", PORT), APKHandler) as httpd:
        httpd.serve_forever()
