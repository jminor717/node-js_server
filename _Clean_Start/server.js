const Koa = require('koa');
const Router = require('@koa/router');
const fs = require('fs');

const app = new Koa();
const router = new Router();
const port = 3000;

function sendFile(ctx, fileName){
    // ctx.body = index;
    ctx.response.type = 'html';
    ctx.response.body = fs.readFileSync(__dirname + fileName);
}

router.get('/', (ctx, next) => sendFile(ctx, '\\index.html'));
router.get('/game', (ctx, next) => sendFile(ctx, '\\gme\\game.html'));

// static file server
router.get(/\/[^\/]+\.[\w]+/, async (ctx, next) => {
    try {
        index = fs.readFileSync(__dirname + ctx.url); //   +"\\.."+
        if (ctx.url.endsWith(".js")) {
            ctx.response.type = 'text/javascript';
        }
        ctx.response.body = index;
    } catch (error) {
        ctx.status = error.statusCode || error.status || 500;
        ctx.body = {
            message: error.message
        };
    }

});

app.listen(port, '0.0.0.0', function () {
    console.log("Listening on " + port);
});

// log all calls to server
app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
});

app.use(router.routes()).use(router.allowedMethods());