# Lokaler Test-Server ohne Browser-Zwischenspeicher:  python serve.py   ->  http://localhost:8000
import http.server, socketserver
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, max-age=0')
        super().end_headers()
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml'}
with socketserver.TCPServer(('', 8000), H) as s:
    print('Mondkatze: http://localhost:8000'); s.serve_forever()
