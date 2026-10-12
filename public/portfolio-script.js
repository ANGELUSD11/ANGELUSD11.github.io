// ---------------------------------------------------------------------------
// Idioma
// ---------------------------------------------------------------------------
let currentLang = 'es';
try {
    if (localStorage.getItem('lang') === 'en') currentLang = 'en';
} catch (e) {
    // localStorage bloqueado: se queda en español
}

function updateText(isInitialLoad = false) {
    document.documentElement.lang = currentLang;
    document.querySelectorAll('#langBtn [data-lang]').forEach(el => {
        el.classList.toggle('on', el.dataset.lang === currentLang);
    });

    const elements = document.querySelectorAll('[data-es][data-en]');
    elements.forEach(element => {
        const esText = element.getAttribute('data-es');
        const enText = element.getAttribute('data-en');
        const newText = currentLang === 'es' ? esText : enText;

        // No aplicar efecto de desvanecimiento en la carga inicial
        if (isInitialLoad) {
            element.innerHTML = newText;
        } else {
            if (element.innerHTML !== newText) {
                element.style.opacity = '0';
                setTimeout(() => {
                    element.innerHTML = newText;
                    element.style.opacity = '1';
                }, 200);
            }
        }
    });
}

function setLang(lang) {
    currentLang = lang === 'en' ? 'en' : 'es';
    try {
        localStorage.setItem('lang', currentLang);
    } catch (e) {
        // sin persistencia
    }
    updateText();
}

// ---------------------------------------------------------------------------
// Contador de suscriptores (SocialCounts)
// ---------------------------------------------------------------------------
// Channel ID - Cambia esto por tu ID de canal
const CHANNEL_ID = 'UCFYLLqA03vesXUt-3eTP81A';

async function fetchSubscriberCount() {
    const subscriberElement = document.getElementById('subscriberCount');
    if (!subscriberElement) return; // Do nothing if the element doesn't exist

    try {
        const response = await fetch(
            `https://api.socialcounts.org/youtube-live-subscriber-count/${CHANNEL_ID}`,
            { cache: 'no-store' }
        );
        const data = await response.json();

        // Intenta varios campos comunes de la API
        const subs =
            data?.counters?.estimation?.subscriberCount ??
            data?.counters?.api?.subscriberCount ??
            null;

        if (subs != null && !Number.isNaN(Number(subs))) {
            subscriberElement.textContent = formatNumber(Number(subs));
            return;
        }

        console.warn('No se encontró campo de subs válido en la respuesta');
        subscriberElement.textContent = 'N/A';
    } catch (error) {
        console.error('Error fetching subscriber count:', error);
        subscriberElement.textContent = 'N/A';
    }
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

if (document.getElementById('subscriberCount')) {
    fetchSubscriberCount();
    setInterval(fetchSubscriberCount, 10000);
}

// ---------------------------------------------------------------------------
// Reloj de la barra de tmux
// ---------------------------------------------------------------------------
function tickClock() {
    const clock = document.getElementById('clock');
    if (!clock) return;
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    clock.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${String(d.getFullYear()).slice(2)}`;
}
tickClock();
setInterval(tickClock, 15000);

// ---------------------------------------------------------------------------
// Fondo: olas en arte ASCII
// ---------------------------------------------------------------------------
function initWaves() {
    const canvas = document.getElementById('waves');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');

    // De valle (vacío) a cresta
    const RAMP = '     ..--~~=^';
    const FONT_SIZE = 14;
    const ROW_H = 18;
    const FPS = 12;
    let cols = 0;
    let rows = 0;

    const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.font = `${FONT_SIZE}px "JetBrains Mono", ui-monospace, Consolas, monospace`;
        ctx.textBaseline = 'top';
        cols = Math.ceil(window.innerWidth / ctx.measureText('~').width) + 1;
        rows = Math.ceil(window.innerHeight / ROW_H);
    };

    const draw = t => {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        for (let y = 0; y < rows; y++) {
            const depth = y / rows; // 0 = horizonte (arriba), 1 = orilla (abajo)
            const k = 0.2 - depth * 0.09; // olas más largas cuanto más cerca
            const sway = Math.sin(y * 0.45 + t * 0.5) * 1.6 + y * 0.9;
            let line = '';
            for (let x = 0; x < cols; x++) {
                const v =
                    Math.sin(x * k + t * 1.1 + sway) +
                    0.5 * Math.sin(x * k * 2.3 - t * 0.7 + y * 1.7);
                const n = (v + 1.5) / 3;
                line += RAMP[Math.min(RAMP.length - 1, Math.floor(n * RAMP.length))];
            }
            // una sola llamada por fila; más tenue hacia el horizonte
            ctx.fillStyle = `rgba(63, 224, 255, ${0.03 + depth * 0.15})`;
            ctx.fillText(line, 0, y * ROW_H);
        }
    };

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let last = 0;
    const loop = now => {
        if (now - last >= 1000 / FPS) {
            last = now;
            draw(now / 1000);
        }
        requestAnimationFrame(loop);
    };

    const refresh = () => {
        resize();
        if (reduced) draw(0);
    };
    window.addEventListener('resize', refresh);
    // el ancho de celda cambia cuando termina de cargar la fuente
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
    refresh();
    if (!reduced) requestAnimationFrame(loop);
}

// ---------------------------------------------------------------------------
// Efecto de tipeo: cada bloque "tipea" su comando al entrar en pantalla
// ---------------------------------------------------------------------------
function initTyping() {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !('IntersectionObserver' in window)) return;

    const run = block => {
        const cmd = block.querySelector('.prompt .cmd');
        const text = cmd.dataset.text;
        // comandos largos tipean más rápido: ~0.6s como máximo por línea
        const delay = Math.min(45, 600 / text.length);
        let i = 0;
        block.classList.add('typing');
        const step = () => {
            cmd.textContent = text.slice(0, ++i);
            if (i < text.length) {
                setTimeout(step, delay * (0.6 + Math.random() * 0.8));
            } else {
                setTimeout(() => block.classList.remove('typing', 'pending'), 160);
            }
        };
        step();
    };

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            observer.unobserve(entry.target);
            run(entry.target);
        });
    }, { rootMargin: '0px 0px -8% 0px' });

    document.querySelectorAll('.block').forEach(block => {
        const cmd = block.querySelector('.prompt .cmd');
        if (!cmd) return;
        cmd.dataset.text = cmd.textContent;
        cmd.textContent = '';
        block.classList.add('pending');
        observer.observe(block);
    });
}

// ---------------------------------------------------------------------------
// Posts del blog: "mostrar más / menos"
// ---------------------------------------------------------------------------
function initCollapse() {
    document.querySelectorAll('.toggle-btn').forEach(button => {
        const content = document.querySelector(button.getAttribute('href'));
        const toggleText = button.querySelector('span');
        if (!content) return;

        button.addEventListener('click', e => {
            e.preventDefault();
            const open = content.classList.toggle('show');
            button.setAttribute('aria-expanded', String(open));
            if (toggleText) {
                toggleText.setAttribute('data-es', open ? 'Mostrar menos' : 'Mostrar más');
                toggleText.setAttribute('data-en', open ? 'Show less' : 'Show more');
                toggleText.textContent = toggleText.getAttribute('data-' + currentLang);
            }
        });
    });
}

// ---------------------------------------------------------------------------
// Shell interactiva del home
// ---------------------------------------------------------------------------
function initShell() {
    const box = document.getElementById('shellBox');
    const log = document.getElementById('shellLog');
    const form = document.getElementById('shellForm');
    const input = document.getElementById('shellInput');
    if (!box || !log || !form || !input) return;

    const sections = ['about', 'links', 'experience', 'projects', 'skills', 'media'];
    const pages = { devlog: '/blog', blog: '/blog', advad: '/advad' };
    const urls = {
        discord: 'https://discord.gg/yS2APXgD7X',
        github: 'https://github.com/ANGELUSD11',
        youtube: 'https://www.youtube.com/@ANGELUSD11',
        twitch: 'https://www.twitch.tv/angelusd11',
    };
    const t = (es, en) => (currentLang === 'es' ? es : en);
    const history = [];
    let cursor = 0;

    const print = (text, cls) => {
        const line = document.createElement('div');
        if (cls) line.className = cls;
        line.textContent = text;
        log.appendChild(line);
    };

    const goTo = name => {
        const key = name.replace(/^~\/?/, '').replace(/\/$/, '');
        if (key === '' || key === 'home') {
            window.scrollTo({ top: 0 });
        } else if (sections.includes(key)) {
            document.getElementById(key).scrollIntoView();
        } else if (pages[key]) {
            window.location.href = pages[key];
        } else {
            print(`bash: cd: ${name}: ${t('No existe el directorio', 'No such file or directory')}`, 'err');
        }
    };

    const commands = {
        help: () => print(t(
            'Comandos disponibles:\n' +
            '  ls              lista secciones y páginas\n' +
            '  cd <destino>    salta a una sección o página (ej. cd projects, cd devlog)\n' +
            '  cat about.txt   imprime el "sobre mí"\n' +
            '  open <red>      abre discord | github | youtube | twitch\n' +
            '  lang [es|en]    cambia el idioma\n' +
            '  whoami, date, echo, clear',
            'Available commands:\n' +
            '  ls              list sections and pages\n' +
            '  cd <target>     jump to a section or page (e.g. cd projects, cd devlog)\n' +
            '  cat about.txt   print the about text\n' +
            '  open <site>     open discord | github | youtube | twitch\n' +
            '  lang [es|en]    switch language\n' +
            '  whoami, date, echo, clear'
        )),
        ls: () => print('about.txt  links/  experience/  projects/  skills/  media/  devlog/  advad/'),
        cd: args => goTo(args[0] || '~'),
        cat: args => {
            const file = (args[0] || '').replace(/\.txt$/, '');
            if (file === 'about') {
                print(document.getElementById('about-text').textContent.replace(/\s+/g, ' ').trim());
            } else if (!args[0]) {
                print(t('uso: cat about.txt', 'usage: cat about.txt'), 'err');
            } else {
                print(`cat: ${args[0]}: ${t('No existe el archivo', 'No such file or directory')}`, 'err');
            }
        },
        open: args => {
            const url = urls[(args[0] || '').toLowerCase()];
            if (url) {
                window.open(url, '_blank', 'noopener');
                print(`${t('abriendo', 'opening')} ${url} ...`);
            } else {
                print(t('uso: open discord|github|youtube|twitch', 'usage: open discord|github|youtube|twitch'), 'err');
            }
        },
        lang: args => {
            const next = args[0] || (currentLang === 'es' ? 'en' : 'es');
            if (next !== 'es' && next !== 'en') {
                print(t('uso: lang es|en', 'usage: lang es|en'), 'err');
                return;
            }
            setLang(next);
            print(`LANG=${next}`);
        },
        whoami: () => print('guest'),
        date: () => print(new Date().toString()),
        echo: args => print(args.join(' ')),
        clear: () => { log.textContent = ''; },
        neofetch: () => goTo('~'),
        sudo: () => print(t(
            'guest no está en el archivo sudoers. Este incidente será reportado.',
            'guest is not in the sudoers file. This incident will be reported.'
        ), 'err'),
        exit: () => print(t('No hay salida. Prueba `cd devlog`.', 'There is no exit. Try `cd devlog`.')),
    };

    form.addEventListener('submit', e => {
        e.preventDefault();
        const raw = input.value.trim();
        input.value = '';
        print(`$ ${raw}`, 'echo');
        if (!raw) return;

        history.push(raw);
        cursor = history.length;
        const [name, ...args] = raw.split(/\s+/);
        const command = commands[name.toLowerCase()];
        if (command) {
            command(args);
        } else {
            print(`bash: ${name}: ${t('orden no encontrada', 'command not found')}`, 'err');
        }
        input.scrollIntoView({ block: 'nearest' });
    });

    input.addEventListener('keydown', e => {
        if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
        if (!history.length) return;
        e.preventDefault();
        cursor = Math.max(0, Math.min(history.length, cursor + (e.key === 'ArrowUp' ? -1 : 1)));
        input.value = history[cursor] || '';
    });

    // Clic en cualquier parte del panel enfoca el input (sin romper la selección de texto)
    box.addEventListener('click', () => {
        if (!window.getSelection().toString()) input.focus({ preventScroll: true });
    });
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
    const langBtn = document.getElementById('langBtn');
    if (langBtn) {
        langBtn.addEventListener('click', function() {
            setLang(currentLang === 'es' ? 'en' : 'es');
        });
    }

    // Establecer el texto inicial al cargar la página
    updateText(true);

    initWaves();
    initCollapse();
    initShell();
    initTyping();
});
