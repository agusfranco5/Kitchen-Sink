/* ===== IMÁGENES =====
 Poné archivos PNG en la carpeta img/ con estos nombres (si no existen se ve un placeholder):
 inicio, fondo_mapa, fondo_pregunta, final, personaje, guia,
 obj_hamburguesa, obj_pc, obj_estrellas, obj_colectivo, obj_pincel, obj_actuacion,
 bg_burger, bg_pc, bg_star, bg_bus, bg_brush, bg_act,
 hamburguesa, papas, bebida, ensalada, pizza, pancho, dona, taco,
 monitor, gabinete, teclado, colectivo, paso_boceto, paso_lineart, paso_colorear, paso_sombreado, paso_iluminacion, capa_boceto, capa_lineart, capa_colorear, capa_sombreado, capa_iluminacion,
 gabinete_pc, motherboard, procesador, ram, nvme, fuente */

const W = 800, H = 450;
const cv = document.getElementById('c'), g = cv.getContext('2d');

const IM = {};

function im(k) {
    if (!(k in IM)) {
        const i = new Image();
        i.onload = () => i.ok = 1;
        i.src = 'img/' + k + '.png';
        IM[k] = i;
    }

    return IM[k].ok ? IM[k] : null;
}

function spr(k, x, y, w, h, col, e) {
    const i = im(k);

    if (i) {
        g.drawImage(i, x, y, w, h);
    } else {
        g.fillStyle = col;
        g.fillRect(x, y, w, h);

        g.strokeStyle = 'rgba(0,0,0,.45)';
        g.lineWidth = 2;
        g.strokeRect(x + 1, y + 1, w - 2, h - 2);

        if (e) {
            T(e, x + w / 2, y + h / 2 + Math.min(w, h) * .17,
                Math.min(w, h) * .5, '#000', 'center');
        }
    }
}

function bgi(k, col) {
    const i = im(k);

    if (i) {
        g.drawImage(i, 0, 0, W, H);
    } else {
        g.fillStyle = col;
        g.fillRect(0, 0, W, H);
    }
}

function T(s, x, y, sz, col, al, wt) {
    g.font = (wt || '700') + ' ' + sz + 'px "Bricolage Grotesque",system-ui,sans-serif';
    g.fillStyle = col || '#1d2433';
    g.textAlign = al || 'left';
    g.fillText(s, x, y);
}

function wrap(s, x, y, mw, lh, sz, col, al) {
    g.font = '500 ' + sz + 'px "Bricolage Grotesque",system-ui,sans-serif';

    let l = '';

    for (const w of s.split(' ')) {
        const t = l ? l + ' ' + w : w;

        if (g.measureText(t).width > mw && l) {
            T(l, x, y, sz, col, al, '500');
            y += lh;
            l = w;
        } else {
            l = t;
        }
    }

    T(l, x, y, sz, col, al, '500');
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const R = (a, b) => a + Math.random() * (b - a);
const ov = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

const K = {};
let S, P, M;


/* ===== DATOS ===== */

const LV = [
    {
        m: [
            {id: 'burger', k: 'hamburguesa', e: '🍔', bg: '#e8b04a'},
            {id: 'pc', k: 'pc', e: '💻', bg: '#9fb3c8'}
        ]
    },
    {
        m: [
            {id: 'star', k: 'estrellas', e: '✨', bg: '#141a3a'},
            {id: 'bus', k: 'colectivo', e: '🚌', bg: '#8fbf8f'}
        ]
    },
    {
        m: [
            {id: 'brush', k: 'pincel', e: '🖌️', bg: '#f1d6e6'},
            {id: 'act', k: 'actuacion', e: '🎭', bg: '#5a2a3a'}
        ]
    }
];

LV.forEach((l, i) => {
    l.n = TX.niveles[i].n;
    l.q = TX.niveles[i].q;
    l.m.forEach((m, j) => Object.assign(m, TX.niveles[i].m[j]));
});

const POS = [
    [[110, 140], [600, 290]],
    [[620, 110], [130, 300]],
    [[130, 120], [560, 300]]
];


/* ===== UI ===== */

const say = t => document.getElementById('say').textContent = t;

function drawInv() {
    const el = document.getElementById('inv');
    el.innerHTML = '';

    for (let i = 0; i < 6; i++) {
        const m = S.inv[i];

        el.insertAdjacentHTML(
            'beforeend',
            '<div class="slot" title="' + (m ? m.nm : '') + '">' +
            (m ? '<img src="img/obj_' + m.k + '.png" onerror="this.remove()">' : '') +
            '</div>'
        );
    }
}


/* ===== MOVIMIENTO ===== */

function mv(p, dt, sp, wo) {
    const A = !wo;

    let dx = (A && K.ArrowRight || K.d ? 1 : 0)
           - (A && K.ArrowLeft || K.a ? 1 : 0);

    let dy = (A && K.ArrowDown || K.s ? 1 : 0)
           - (A && K.ArrowUp || K.w ? 1 : 0);

    if (dx && dy) {
        dx *= .707;
        dy *= .707;
    }

    const ox = p.x, oy = p.y;

    p.x = clamp(p.x + dx * sp * dt, 0, W - p.w);
    p.y = clamp(p.y + dy * sp * dt, 0, H - p.h);

    return [p.x - ox, p.y - oy];
}


/* ===== MINIJUEGOS ===== */

function fin(ok, msg) {
    if (M.res) return;

    M.res = ok ? 1 : -1;
    M.rt = 1.4;
    say(msg);

    if (ok) {
        S.inv.push(ALL.find(m => m.id == M.id));
        drawInv();
    }
}

const FOOD = [
    ['hamburguesa'],
    ['papas'],
    ['bebida'],
    ['ensalada'],
    ['pizza'],
    ['pancho'],
    ['dona'],
    ['taco']
];

const MG = {
    burger: {
        init() {
            P = {x: 380, y: 200, w: 36, h: 36};
            this.got = 0;
            this.indexEsperado = 0;

            this.it = FOOD.map((f, i) => ({
                f,
                x: R(60, 700),
                y: R(90, 380),
                vx: R(-50, 50),
                vy: R(-50, 50)
            }));

            for (const o of this.it) {
                if (Math.hypot(o.x - P.x, o.y - P.y) < 90) o.x = 700;
            }
        },

        upd(dt) {
            mv(P, dt, 230);

            for (const o of this.it) {
                o.x += o.vx * dt;
                o.y += o.vy * dt;

                if (o.x < 0 || o.x > W - 40) o.vx *= -1;
                if (o.y < 70 || o.y > H - 40) o.vy *= -1;
            }

            for (const o of this.it.slice()) {
                if (ov(P, {x: o.x, y: o.y, w: 40, h: 40})) {
                    const i = FOOD.indexOf(o.f);

                    if (i === this.indexEsperado && i < 3) {
                        this.it.splice(this.it.indexOf(o), 1);
                        this.got++;
                        this.indexEsperado++;
                        say(TX.burger.ok);

                        if (this.got == 3) fin(1, TX.burger.win);
                    } else {
                        fin(0, TX.burger.fail);
                    }
                }
            }
        },

        draw() {
            this.it.forEach(o => spr(o.f[0], o.x, o.y, 40, 40, '#fff', o.f[1]));
            spr('personaje', P.x, P.y, 36, 36, '#f5b700', '🙂');

            g.fillStyle = 'rgba(255,255,255,.9)';
            g.fillRect(10, 10, 230, 56);

            T(TX.burger.comanda, 20, 30, 14);
            
            [0, 1, 2].forEach(i => {
                const x = 24 + i * 70;
                // PNG del ítem de la comanda (atenuado hasta que se complete) 
                g.globalAlpha = i < this.got ? 1 : .45;
                spr(FOOD[i][0], x, 34, 28, 28, '#fff');           
                g.globalAlpha = 1;
                // marca de completado al lado del ícono
                T(i < this.got ? '✔' : '·', x + 34, 56, 22, '#000');
            });
    },
},

    pc: {
        init() {
            P = {x: 100, y: 200, w: 36, h: 36};

            // Gabinete estático en el centro
            this.cabinet = { x: 280, y: 55, w: 260, h: 320 };

            // Zonas objetivo dentro del gabinete
            this.sl = [
                {k: 'motherboard', e: '🧩', x: 330, y: 110, w: 140, h: 140},
                {k: 'procesador', e: '🔲', x: 379, y: 133, w: 45, h: 45},
                {k: 'ram', e: '📊', x: 415, y: 135, w: 20, h: 65},
                {k: 'nvme', e: '⚡', x: 365, y: 195, w: 50, h: 18},
                {k: 'fuente', e: '🔌', x: 320, y: 229, w: 136, h: 60}
            ];

            // Componentes con hitboxes internas bastante más chicas y centradas
            this.c = [
                {s: 0, x: 550, y: 70, w: 140, h: 140, ix: 35, iy: 35, iw: 70, ih: 70},
                {s: 1, x: 580, y: 240, w: 45, h: 45, ix: 10, iy: 10, iw: 25, ih: 25},
                {s: 2, x: 180, y: 70, w: 20, h: 65, ix: 6, iy: 12, iw: 8, ih: 41},
                {s: 3, x: 170, y: 200, w: 50, h: 18, ix: 10, iy: 4, iw: 30, ih: 10},
                {s: 4, x: 140, y: 310, w: 140, h: 60, ix: 25, iy: 15, iw: 90, ih: 30}
            ].map(c => ({
                ...c,
                k: this.sl[c.s].k,
                e: this.sl[c.s].e,
                lock: 0
            }));
        },

        upd(dt) {
            const [dx, dy] = mv(P, dt, 200);

            for (const c of this.c) {
                if (c.lock) continue;
                
                // Hitbox interna reducida para ignorar los bordes transparentes
                const hitBoxC = { x: c.x + c.ix, y: c.y + c.iy, w: c.iw, h: c.ih };
                if (!ov(P, hitBoxC)) continue;

                c.x = clamp(c.x + dx, 0, W - c.w);
                c.y = clamp(c.y + dy, 0, H - c.h);

                const s = this.sl[c.s];

                if (Math.abs(c.x - s.x) < 18 && Math.abs(c.y - s.y) < 18) {
                    c.x = s.x;
                    c.y = s.y;
                    c.lock = 1;
                }
            }

            if (this.c.every(c => c.lock)) fin(1, TX.pc.win);
        },

        draw() {
            // Dibujar Gabinete usando spr
            spr('gabinete_pc', this.cabinet.x, this.cabinet.y, this.cabinet.w, this.cabinet.h, '#222938', '🖥️');

            // Tapa lateral de vidrio translúcida o detalle frontal
            g.fillStyle = 'rgba(255, 255, 255, 0.05)';
            g.fillRect(this.cabinet.x + 10, this.cabinet.y + 10, this.cabinet.w - 20, this.cabinet.h - 20);

            // Título o marca del gabinete
            T('GABINETE', this.cabinet.x + this.cabinet.w / 2, this.cabinet.y + 30, 12, '#718096', 'center');

            // Dibujar componentes (piezas del puzzle)
            this.c.forEach(c => spr(
                c.k,
                c.x,
                c.y,
                c.w,
                c.h,
                c.lock ? '#7fc8a9' : '#c8d3e0',
                c.e
            ));

            spr('personaje', P.x, P.y, 36, 36, '#f5b700', '🙂');
        }
    },

    star: {
        init() {
            P = {x: 40, y: 200, w: 36, h: 36};

            this.b = [[260, 270], [400, 220], [540, 170]];
            this.o = [[220, 90], [600, 80], [290, 390], [560, 380]];

            this.d = Array.from({length: 22}, () => [
                R(20, 780),
                R(20, 430)
            ]).filter(d =>
                [...this.b, ...this.o].every(
                    s => Math.hypot(s[0] - d[0], s[1] - d[1]) > 40
                )
            );

            this.l = [];
            this.h = 0;
        },

        upd(dt) {
            mv(P, dt, 220);
            this.h -= dt;

            this.b.forEach((s, i) => {
                if (this.l.includes(i) || Math.hypot(s[0] - P.x - 18, s[1] - P.y - 18) > 26) return;

                const L = this.l;
                const ok = L.length == 0 ? i != 1 : L.length == 1 ? i == 1 : true;

                if (ok) {
                    L.push(i);
                    say(TX.star.ok);

                    if (L.length == 3) fin(1, TX.star.win);
                } else if (this.h <= 0) {
                    this.h = 3;
                    say(TX.star.fail);
                }
            });
        },

        draw() {
            g.fillStyle = '#fff';
            this.d.forEach(d => g.fillRect(d[0], d[1], 2, 2));

            [...this.b, ...this.o].forEach((s, i) => {
                g.beginPath();
                g.arc(s[0], s[1], i < 3 ? 11 : 7, 0, 7);
                g.fillStyle = this.l.includes(i) ? '#f5b700' : '#fff';
                g.fill();
            });

            g.strokeStyle = '#f5b700';
            g.lineWidth = 3;
            g.beginPath();

            this.l.forEach((i, j) =>
                j ? g.lineTo(...this.b[i]) : g.moveTo(...this.b[i])
            );

            if (this.l.length && this.l.length < 3) g.lineTo(P.x + 18, P.y + 18);
            g.stroke();

            if (M.res > 0) {
                g.strokeStyle = 'rgba(255,255,255,.6)';
                g.lineWidth = 2;
                g.beginPath();

                [[0, 2], [2, 1], [1, 3], [3, 0]].forEach(([a, b]) => {
                    g.moveTo(...this.o[a]);
                    g.lineTo(...this.o[b]);
                });

                g.stroke();
            }

            spr('personaje', P.x, P.y, 36, 36, '#f5b700', '🙂');
        }
    },

    bus: {
        init() {
            P = {x: 50, y: 200, w: 36, h: 36};

            const C = 110, ox = 235, oy = 50;

            this.C = C;
            this.ox = ox;
            this.oy = oy;

            const sol = {
                '0,1': 10,
                '1,1': 12,
                '1,2': 3,
                '2,2': 9,
                '2,1': 6
            };

            this.t = [];

            for (let y = 0; y < 3; y++) {
                this.t[y] = [];

                for (let x = 0; x < 3; x++) {
                    let m = sol[x + ',' + y] ?? [5, 10, 3, 6, 12, 9, 0][Math.floor(R(0, 7))];
                    const r = Math.floor(R(1, 4));

                    for (let i = 0; i < r; i++) {
                        m = ((m << 1) | (m >> 3)) & 15;
                    }

                    this.t[y][x] = m;
                }
            }

            this.bus = -1;

            this.pts = [
                [0, 1],
                [1, 1],
                [1, 2],
                [2, 2],
                [2, 1]
            ].map(([x, y]) => [ox + x * C + C / 2, oy + y * C + C / 2]);

            this.pts.unshift([ox - 30, this.pts[0][1]]);
            this.pts.push([ox + 3 * C + 30, this.pts[this.pts.length - 1][1]]);
        },

        ok() {
            let x = 0, y = 1, d = 2;

            for (let n = 0; n < 30; n++) {
                if (x < 0 || x > 2 || y < 0 || y > 2) return x > 2 && y == 1;

                const m = this.t[y][x];
                const inb = ((d << 2) | (d >> 2)) & 15;

                if (!(m & inb)) return false;

                const o = m & ~inb;

                if (![1, 2, 4, 8].includes(o)) return false;

                d = o;
                x += d == 2 ? 1 : d == 8 ? -1 : 0;
                y += d == 4 ? 1 : d == 1 ? -1 : 0;
            }

            return false;
        },

        key(k) {
            if (M.res || this.bus >= 0 || k != ' ') return;

            const x = Math.floor((P.x + 18 - this.ox) / this.C);
            const y = Math.floor((P.y + 18 - this.oy) / this.C);

            if (x < 0 || x > 2 || y < 0 || y > 2) return;

            let m = this.t[y][x];
            this.t[y][x] = ((m >> 1) | (m << 3)) & 15;

            if (this.ok()) {
                this.bus = 0;
                say(TX.bus.ok);
            }
        },

        upd(dt) {
            mv(P, dt, 200);

            if (this.bus >= 0 && !M.res) {
                this.bus += dt * 260;

                let d = this.bus, i = 0;
                const p = this.pts;

                while (i < p.length - 1 && d > Math.hypot(
                    p[i + 1][0] - p[i][0],
                    p[i + 1][1] - p[i][1]
                )) {
                    d -= Math.hypot(
                        p[i + 1][0] - p[i][0],
                        p[i + 1][1] - p[i][1]
                    );

                    i++;
                }

                if (i >= p.length - 1) fin(1, TX.bus.win);
            }
        },

        draw() {
            const C = this.C;
            const hx = Math.floor((P.x + 18 - this.ox) / C);
            const hy = Math.floor((P.y + 18 - this.oy) / C);

            for (let y = 0; y < 3; y++) {
                for (let x = 0; x < 3; x++) {
                    const X = this.ox + x * C;
                    const Y = this.oy + y * C;
                    const m = this.t[y][x];

                    g.fillStyle = '#b9d9a8';
                    g.fillRect(X + 2, Y + 2, C - 4, C - 4);

                    g.fillStyle = '#4a4f5c';

                    const cx = X + C / 2, cy = Y + C / 2, w = 34;

                    if (m & 1) g.fillRect(cx - w / 2, Y + 2, w, C / 2 - 2 + w / 2);
                    if (m & 4) g.fillRect(cx - w / 2, cy - w / 2, w, C / 2 - 2 + w / 2);
                    if (m & 2) g.fillRect(cx - w / 2, cy - w / 2, C / 2 - 2 + w / 2, w);
                    if (m & 8) g.fillRect(X + 2, cy - w / 2, C / 2 - 2 + w / 2, w);

                    if (x == hx && y == hy) {
                        g.strokeStyle = '#f5b700';
                        g.lineWidth = 4;
                        g.strokeRect(X + 5, Y + 5, C - 10, C - 10);
                    }
                }
            }

            T(TX.bus.entrada, this.ox - 100, this.pts[0][1] + 5, 14, '#000000');
            T(TX.bus.salida, this.ox + 3 * this.C + 8, this.pts[0][1] + 5, 14, '#000000');

            if (this.bus >= 0 && !M.res) {
                let d = this.bus, i = 0;
                const p = this.pts;

                while (i < p.length - 2 && d > Math.hypot(
                    p[i + 1][0] - p[i][0],
                    p[i + 1][1] - p[i][1]
                )) {
                    d -= Math.hypot(
                        p[i + 1][0] - p[i][0],
                        p[i + 1][1] - p[i][1]
                    );

                    i++;
                }

                const l = Math.hypot(
                    p[i + 1][0] - p[i][0],
                    p[i + 1][1] - p[i][1]
                );

                const t = Math.min(1, d / l);

                spr(
                    'colectivo',
                    p[i][0] + (p[i + 1][0] - p[i][0]) * t - 40,
                    p[i][1] + (p[i + 1][1] - p[i][1]) * t - 40,
                    80,
                    80,
                    '#f5b700',
                    '🚌'
                );
            }

            spr('personaje', P.x, P.y, 36, 36, '#f5b700', '🙂');
        }
    },

    brush: {
        N: [
            ['boceto', '✏'],
            ['lineart', '🖊️'],
            ['colorear', '🎨'],
            ['sombreado', '🌗'],
            ['iluminacion', '💡']
        ].map((a, i) => [...a, TX.brush.pasos[i]]),

        col: ['#9aa5b1', '#1d2433', '#e4572e', '#6a4c93', '#ffd166'],

        init() {
            P = {x: 30, y: H - 90, w: 36, h: 36};
            this.n = 0;
            this.it = [];

            for (let i = 0; i < 5; i++) {
                let x, y, t = 0;

                do {
                    x = R(60, 720);
                    y = R(200, 380);
                    t++;
                } while (
                    t < 200 &&
                    (
                        this.it.some(o => Math.hypot(o.x - x, o.y - y) < 110) ||
                        Math.hypot(x - P.x, y - P.y) < 90
                    )
                );

                this.it.push({i, x, y});
            }
        },

        upd(dt) {
            mv(P, dt, 230);

            this.it.slice().forEach(o => {
                if (o.i == this.n && ov(P, {x: o.x, y: o.y, w: 56, h: 56})) {
                    this.it.splice(this.it.indexOf(o), 1);
                    this.n++;
                    say(TX.brush.ok);

                    if (this.n == 5) fin(1, TX.brush.win);
                }
            });
        },

        draw() {
            g.fillStyle = '#fffdf6';
            g.fillRect(260, 10, 280, 170);

            for (let i = 0; i < this.n; i++) {
                const n = this.N[i], c = im('capa_' + n[0]);

                if (c) {
                    g.drawImage(c, 260, 10, 280, 170);
                } else {
                    g.globalAlpha = .5;
                    g.fillStyle = this.col[i];
                    g.fillRect(268 + i * 10, 18 + i * 10, 264 - i * 20, 154 - i * 20);
                    g.globalAlpha = 1;
                    T(n[1], 280 + i * 46, 50, 26, '#000');
                }
            }

            g.strokeStyle = '#3c4a63';
            g.lineWidth = 4;
            g.strokeRect(260, 10, 280, 170);

            this.it.forEach(o => {
                const n = this.N[o.i];

                spr('paso_' + n[0], o.x, o.y, 56, 56, '#fff', n[1]);
                T(n[2], o.x + 28, o.y + 74, 13, '#000', 'center');
            });

            spr('personaje', P.x, P.y, 36, 36, '#f5b700', '🙂');
        }
    },

    act: {
        A: ['▲', '►', '▼', '◄'],
        C: ['#e4572e', '#f5b700', '#3a86ff', '#2a9d8f'],
        B: [[350, 70], [490, 190], [350, 310], [210, 190]],

        init() {
            this.s = Array.from({length: 5}, () => Math.floor(R(0, 4)));
            this.ph = 0;
            this.t = 0;
            this.i = 0;
            this.hl = -1;
            this.ht = 0;

            say(TX.act.mira);
        },

        key(k) {
            if (M.res || this.ph != 1) return;

            const n = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'].indexOf(k);

            if (n < 0) return;

            this.hl = n;
            this.ht = .25;

            if (n == this.s[this.i]) {
                this.i++;

                if (this.i == 5) fin(1, TX.act.win);
            } else {
                fin(0, TX.act.fail);
            }
        },

        upd(dt) {
            this.ht -= dt;

            if (this.ht <= 0 && this.ph != 1) this.hl = -1;

            if (this.ph == 0) {
                this.t += dt;

                const k = Math.floor(this.t / .8) - 1;

                if (k >= 0 && k < 5 && this.t % .8 < .5) {
                    this.hl = this.s[k];
                    this.ht = .1;
                }

                if (this.t > 5) {
                    this.ph = 1;
                    this.hl = -1;
                    say(TX.act.turno);
                }
            }
        },

        draw() {
            this.B.forEach((b, i) => {
                g.globalAlpha = this.hl == i ? 1 : .35;
                g.fillStyle = this.C[i];
                g.fillRect(b[0], b[1], 100, 100);
                g.globalAlpha = 1;

                T(this.A[i], b[0] + 50, b[1] + 66, 40, '#fff', 'center');
            });

            T(
                this.ph ? TX.act.progreso + ' ' + this.i + '/5' : TX.act.observa,
                400,
                40,
                20,
                '#fff',
                'center'
            );
        }
    }
};


/* ===== FLUJO ===== */

const ALL = LV.flatMap(l => l.m);

const STG = [
    {t: 'mg', id: 'burger'},
    {t: 'mg', id: 'pc'},
    {t: 'q', lv: 0},
    {t: 'mg', id: 'star'},
    {t: 'mg', id: 'bus'},
    {t: 'q', lv: 1},
    {t: 'mg', id: 'brush'},
    {t: 'mg', id: 'act'},
    {t: 'q', lv: 2}
];

const OBJP = [
    [640, 150],
    [650, 300],
    [600, 100],
    [660, 250],
    [620, 320],
    [640, 120]
];

const hint = id => ALL.find(m => m.id == id).hi;

function go(cb, dur) {
    if (!S.fd) S.fd = {a: 0, d: 1, dur: dur || .7, cb};
}

function enter() {
    const st = STG[S.i];
    S.pick = null;

    if (st.t == 'q') {
        S.scr = 'q';
        P = {x: W / 2 - 20, y: H / 2 - 20, w: 40, h: 40};
        say(TX.pregunta.ayuda);
    } else {
        S.scr = 'over';
        S.mi = STG.slice(0, S.i).filter(x => x.t == 'mg').length;
        P = {x: 20, y: H / 2 - 20, w: 40, h: 40};
        S.sx = P.x;
        say(TX.mapa[S.mi]);
    }
}

function next() {
    S.i++;

    if (S.i >= STG.length) {
        S.scr = 'end';
        say(TX.finalGuia);
    } else {
        enter();
    }
}

function reset() {
    S = {
        scr: 'over',
        i: 0,
        inv: [],
        ch: [],
        t: 0,
        ta: 0,
        moved: 0,
        fd: {a: 1, d: -1, dur: 1.4}
    };

    M = null;
    enter();
    drawInv();
}

function startMG(id) {
    S.scr = 'mg';
    M = Object.assign({id, res: 0, rt: 0}, MG[id]);
    M.init();
    say(hint(id));
}

function choose(i) {
    const m = LV[STG[S.i].lv].m[i];

    S.ch.push(m);
    S.pick = i;
    say(TX.elegiste + ' ' + m.t + '.');
    go(next, 1.2);
}


/* ===== LOOP ===== */

function update(dt) {
    S.t += dt;

    S.ta = clamp(
        S.ta + (S.i == 0 && !S.moved ? 1 : -1) * dt * .4,
        0,
        .8
    );

    const f = S.fd;

    if (f) {
        f.a += f.d * dt / f.dur;

        if (f.d > 0 && f.a >= 1) {
            f.a = 1;
            f.d = -1;
            f.cb();
        } else if (f.d < 0 && f.a <= 0) {
            S.fd = null;
        }

        return;
    }

    if (S.scr == 'over') {
        mv(P, dt, 240);

        if (!S.moved && Math.abs(P.x - S.sx) + Math.abs(P.y - (H / 2 - 20)) > 40) {
            S.moved = 1;
        }

        const o = OBJP[S.mi];

        if (ov(P, {x: o[0], y: o[1], w: 60, h: 60})) {
            const id = STG[S.i].id;
            go(() => startMG(id), .6);
        }
    }

    else if (S.scr == 'mg') {
        if (M.exit) {
            mv(P, dt, 240);

            if (P.x + P.w >= W - 2) go(next, .8);
        }

        else if (M.res) {
            M.rt -= dt;

            if (M.rt <= 0) {
                if (M.res > 0) {
                    M.exit = 1;

                    if (M.id == 'act') {
                        P = {x: W / 2 - 18, y: H / 2 - 18, w: 36, h: 36};
                    }

                    say(TX.salida);
                } else {
                    M.res = 0;
                    M.init();
                    say(hint(M.id));
                }
            }
        }

        else {
            M.upd && M.upd(dt);
        }
    }

    else if (S.scr == 'q' && S.pick == null) {
        mv(P, dt, 260);

        if (P.x < 16) {
            choose(0);
        } else if (P.x + P.w > W - 16) {
            choose(1);
        }
    }
}

function draw() {
    g.clearRect(0, 0, W, H);

    if (S.scr == 'over') {
        bgi('fondo_mapa', '#c9d6c2');

        const p = OBJP[S.mi];
        const m = ALL.find(x => x.id == STG[S.i].id);

        spr('obj_' + m.k, p[0], p[1], 60, 60, '#f5b700', m.e);
        spr('personaje', P.x, P.y, P.w, P.h, '#3c4a63', '🙂');

        if (S.ta > 0) {
            g.save();

            g.globalAlpha = S.ta;
            g.shadowColor = 'rgba(0,0,0,.6)';
            g.shadowBlur = 14;
            g.letterSpacing = '3px';
            g.font = '500 62px "Cormorant Garamond",Georgia,serif';
            g.fillStyle = '#f3ead8';
            g.textAlign = 'left';
            g.fillText(TX.titulo, 40, 92);

            g.restore();
        }
    }

    else if (S.scr == 'mg') {
        const m = ALL.find(x => x.id == M.id);

        bgi('bg_' + m.id, m.bg);
        M.draw();

        if (M.exit) {
            g.fillStyle = 'rgba(245,183,0,.7)';
            g.fillRect(W - 16, 0, 16, H);

            T('►', W - 80, H / 2 + 14, 44, '#f5b700');
            spr('personaje', P.x, P.y, 36, 36, '#f5b700', '🙂');
        }

        else if (M.res) {
            g.fillStyle = 'rgba(0,0,0,.55)';
            g.fillRect(0, 170, W, 100);

            T(
                M.res > 0 ? TX.logrado : TX.reintentar,
                W / 2,
                235,
                48,
                M.res > 0 ? '#7fc8a9' : '#e4572e',
                'center',
                '800'
            );
        }
    }

    else if (S.scr == 'q') {
        bgi('fondo_pregunta', '#2b3550');

        const L = LV[STG[S.i].lv];

        g.fillStyle = 'rgba(245,183,0,.7)';
        g.fillRect(0, 0, 16, H);
        g.fillRect(W - 16, 0, 16, H);

        T(L.q, W / 2, 70, 44, '#f5b700', 'center', '800');

        [0, 1].forEach(i => {
            const m = L.m[i], X = i ? W - 200 : 50;

            spr('obj_' + m.k, X + 45, 145, 60, 60, '#f5b700', m.e);
            T(m.nm, X + 75, 235, 18, '#fff', 'center');
            wrap(m.t, X + 75, 262, 135, 20, 15, '#e8edf5', 'center');
        });

        spr('personaje', P.x, P.y, P.w, P.h, '#f5b700', '🙂');
    }

    else {
        bgi('final', '#1d2433');

        T(TX.final.titulo, W / 2, 60, 44, '#f5b700', 'center', '800');

        S.ch.forEach((m, i) => {
            T(
                LV[i].q + '  →  ' + m.e + ' ' + m.nm,
                60,
                115 + i * 34,
                19,
                '#fff',
                'left',
                '500'
            );
        });

        wrap(
            TX.final.concl[0] + S.ch.map(m => m.f).join(', ') + TX.final.concl[1],
            W / 2,
            250,
            640,
            28,
            22,
            '#e8edf5',
            'center'
        );

        if (Math.floor(S.t * 2) % 2) {
            T(TX.final.rejugar, W / 2, 400, 18, '#fff', 'center');
        }
    }

    if (S.fd) {
        g.globalAlpha = clamp(S.fd.a, 0, 1);
        g.fillStyle = '#10151f';
        g.fillRect(0, 0, W, H);
        g.globalAlpha = 1;
    }
}

let last = 0;

function loop(t) {
    const dt = Math.min(.05, (t - last) / 1000 || 0);
    last = t;

    update(dt);
    draw();

    requestAnimationFrame(loop);
}


/* ===== INPUT ===== */

addEventListener('keydown', e => {
    const k = e.key.length == 1 ? e.key.toLowerCase() : e.key;

    if (k.startsWith('Arrow') || k == ' ') e.preventDefault();

    K[k] = 1;

    if (k == 'r') {
        reset();
        return;
    }

    if (k == ' ' && S.scr == 'end') reset();

    if (S.scr == 'mg' && M && M.key && !S.fd) M.key(k);
});

addEventListener('keyup', e => {
    K[e.key.length == 1 ? e.key.toLowerCase() : e.key] = 0;
});

cv.addEventListener('pointerdown', () => {
    if (S.scr == 'end') reset();
});

reset();
requestAnimationFrame(loop);
