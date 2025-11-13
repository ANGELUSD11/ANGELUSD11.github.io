// Language Switcher
let currentLang = 'es';

// Channel ID - Cambia esto por tu ID de canal
const CHANNEL_ID = 'UCFYLLqA03vesXUt-3eTP81A';

// Fetch subscriber count usando SocialCounts
async function fetchSubscriberCount() {
    const subscriberElement = document.getElementById('subscriberCount');
    if (!subscriberElement) return; // Do nothing if the element doesn't exist

    try {
        const response = await fetch(
            `https://api.socialcounts.org/youtube-live-subscriber-count/${CHANNEL_ID}`,
            { cache: 'no-store' }
        );

        console.log('status', response.status);

        const data = await response.json();
        console.log('socialcounts data', data);

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

// Fetch on load and cada 10s
fetchSubscriberCount();
setInterval(fetchSubscriberCount, 10000);

// Language switcher
document.getElementById('langBtn').addEventListener('click', function() {
    currentLang = currentLang === 'es' ? 'en' : 'es';
    document.getElementById('langText').textContent = currentLang === 'es' ? 'EN' : 'ES';

    const elements = document.querySelectorAll('[data-es][data-en]');
    elements.forEach(element => {
        const esText = element.getAttribute('data-es');
        const enText = element.getAttribute('data-en');

        element.style.opacity = '0';
        setTimeout(() => {
            element.textContent = currentLang === 'es' ? esText : enText;
            element.style.opacity = '1';
        }, 200);
    });
});

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Animación al hacer scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeIn 0.6s ease forwards';
        }
    });
}, observerOptions);

document.querySelectorAll('section').forEach(section => {
    observer.observe(section);
});

// CSS animación fadeIn
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

