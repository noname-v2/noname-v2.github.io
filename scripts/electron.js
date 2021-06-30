const { app, BrowserWindow } = require('electron');
const { createServer } = require('http-server');
const { networkInterfaces } = require('os');
const portfinder = require('portfinder');

// FIXME
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = true
process.noDeprecation = true

let win;
let server = null;

function createWindow() {
	win = new BrowserWindow({
		width: 960,
		height: 850,
		x: 20,
		y: 180,
		title: '无名杀',
		webPreferences: {
			nodeIntegration: true
		}
	});
	win.setMenuBarVisibility(false);
	win.webContents.openDevTools(); // FIXME
	win.on('closed', () => {
		win = null;
	});
	if (server === null) {
		server = createServer();
		portfinder.basePort = 8080;
		portfinder.getPort((err, port) => {
			if (err) {
				throw(err);
			}
			win.loadURL('http://127.0.0.1:' + port);
			server.listen(port, () => {
				const ifaces = networkInterfaces();
	
				for (const dev in ifaces) {
					for (const details of ifaces[dev]) {
						if (details.family === 'IPv4') {
							win.webContents.executeJavaScript(`console.log('  http://${details.address}:${port}')`)
						}
					}
				}
			});
		});
	}
}

app.on('ready', createWindow);
app.on('window-all-closed', () => {
	app.quit();
});
app.on('activate', () => {
	if (win === null) {
		createWindow();
	}
});
