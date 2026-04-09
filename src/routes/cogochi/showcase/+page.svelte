<script lang="ts">
  import { onMount } from 'svelte';

  const faqItems = [
    {
      from: 'Federico',
      question: 'Does it impact performance?',
      answer:
        'As every custom code addition does: the overhead is just the one added by the code itself. Everything is also bundled, minified and compressed, to have the least impact on the project, avoiding loading external libraries and increase the number of CDN based scripts.'
    },
    {
      from: 'Federico',
      question: 'Where are my files hosted?',
      answer:
        'Files are hosted in the project delivery layer and shipped from the same deployment pipeline used for the site.'
    },
    {
      from: 'Federico',
      question: 'Help! I pushed the wrong files!',
      answer:
        'Use the rollback path to restore the previous deploy quickly.'
    },
    {
      from: 'Federico',
      question: "What's the Webflow AI Agent?",
      answer:
        'It is the project-aware agent mode that can read the current build context and operate on the live project.'
    },
    {
      from: 'Federico',
      question: 'What is the custom knowledge base?',
      answer:
        'It is the embedded knowledge layer for code patterns, animation systems, WebGL, and page behavior.'
    },
    {
      from: 'Federico',
      question: 'How do I use it with Webflow?',
      answer:
        'Use the MCP-backed flow together with the embedded code surfaces in the project.'
    },
    {
      from: 'Federico',
      question: 'What AIs are available?',
      answer:
        'You can switch between fast and reasoning models depending on the task.'
    },
    {
      from: 'Federico',
      question: 'How does it work?',
      answer:
        'Multiple agents coordinate against the same project state while the pipeline keeps the output deployable.'
    },
    {
      from: 'Federico',
      question: 'How does publishing work?',
      answer:
        'The deploy step bundles, minifies, and ships the project to the CDN-backed endpoint.'
    },
    {
      from: 'Federico',
      question: 'Does it work with the MCP?',
      answer:
        'Yes. The page is designed around the MCP connection and the project-aware agent flow.'
    }
  ];

  const featureSlides = [
    { title: 'AI Mode Switch', src: 'https://ssscript.dev/ssscript-website/various-modes.mp4' },
    { title: 'New Project Flow', src: 'https://ssscript.dev/ssscript-website/project-flow.mp4' },
    { title: 'AI Dock Mode', src: 'https://ssscript.dev/ssscript-website/ai-dock-mode.mp4' },
    { title: 'Account', src: 'https://ssscript.dev/ssscript-website/account.mp4' },
    { title: 'AI Code Editing', src: 'https://ssscript.dev/ssscript-website/code-edits.mp4' },
    { title: 'AI Dev Server', src: 'https://ssscript.dev/ssscript-website/dev-server.mp4' },
    { title: 'Webflow MCP', src: 'https://ssscript.dev/ssscript-website/webflow-mcp.mp4' },
    { title: 'Publishing', src: 'https://ssscript.dev/ssscript-website/publish-flow.mp4' }
  ];

  const chartAssets = [
    {
      title: 'Scanner',
      src: '/cogochi/chart-tools/scanner-grid.svg',
      left: '62%',
      top: '15%',
      size: '13.8rem',
      rotate: '-7deg',
      delay: '0s'
    },
    {
      title: 'Breakout',
      src: '/cogochi/chart-tools/breakout-arrow.svg',
      left: '82%',
      top: '26%',
      size: '8.8rem',
      rotate: '10deg',
      delay: '-1.2s'
    },
    {
      title: 'Zones',
      src: '/cogochi/chart-tools/support-zones.svg',
      left: '87%',
      top: '41%',
      size: '8.8rem',
      rotate: '-4deg',
      delay: '-2s'
    },
    {
      title: 'Risk',
      src: '/cogochi/chart-tools/risk-ratio.svg',
      left: '25%',
      top: '30%',
      size: '8.2rem',
      rotate: '8deg',
      delay: '-0.8s'
    },
    {
      title: 'Volume',
      src: '/cogochi/chart-tools/volume-feed.svg',
      left: '78%',
      top: '82%',
      size: '9rem',
      rotate: '-10deg',
      delay: '-1.7s'
    },
    {
      title: 'Orderbook',
      src: '/cogochi/chart-tools/orderbook-ladder.svg',
      left: '46%',
      top: '84%',
      size: '8.4rem',
      rotate: '5deg',
      delay: '-0.5s'
    },
    {
      title: 'Heatmap',
      src: '/cogochi/chart-tools/liquidity-heatmap.svg',
      left: '88%',
      top: '57%',
      size: '8rem',
      rotate: '13deg',
      delay: '-2.4s'
    },
    {
      title: 'Divergence',
      src: '/cogochi/chart-tools/divergence-oscillator.svg',
      left: '37%',
      top: '83%',
      size: '8rem',
      rotate: '-11deg',
      delay: '-1.4s'
    },
    {
      title: 'Alert',
      src: '/cogochi/chart-tools/alert-tag.svg',
      left: '86%',
      top: '70%',
      size: '7.2rem',
      rotate: '-2deg',
      delay: '-1.9s'
    },
    {
      title: 'VWAP',
      src: '/cogochi/chart-tools/vwap-band.svg',
      left: '22%',
      top: '47%',
      size: '9.2rem',
      rotate: '-8deg',
      delay: '-1.1s'
    },
    {
      title: 'Sweep',
      src: '/cogochi/chart-tools/sweep-marker.svg',
      left: '22%',
      top: '73%',
      size: '8.5rem',
      rotate: '12deg',
      delay: '-2.7s'
    },
    {
      title: 'Momentum',
      src: '/cogochi/chart-tools/momentum-stack.svg',
      left: '63%',
      top: '86%',
      size: '10.2rem',
      rotate: '-6deg',
      delay: '-0.3s'
    },
    {
      title: 'Session',
      src: '/cogochi/chart-tools/session-clock.svg',
      left: '92%',
      top: '79%',
      size: '7.8rem',
      rotate: '5deg',
      delay: '-1.6s'
    },
    {
      title: 'Trend Map',
      src: '/cogochi/chart-tools/trend-map.svg',
      left: '47%',
      top: '13%',
      size: '10rem',
      rotate: '3deg',
      delay: '-0.5s'
    }
  ];

  let email = $state('');
  let name = $state('');
  let message = $state('');
  let submitted = $state(false);
  let submitting = $state(false);
  let errorMsg = $state('');
  let selectedFaq = $state(0);
  let mouseX = $state(50);
  let mouseY = $state(45);
  let accentTone = $state(212);
  let scrollProgress = $state(0);

  function clamp01(value: number) {
    return Math.min(1, Math.max(0, value));
  }

  function updateScroll() {
    if (typeof window === 'undefined') return;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    scrollProgress = clamp01(window.scrollY / maxScroll);
  }

  function updateCursor(event: PointerEvent) {
    if (typeof window === 'undefined') return;
    const x = clamp01(event.clientX / window.innerWidth);
    const y = clamp01(event.clientY / window.innerHeight);
    mouseX = Math.round(x * 100);
    mouseY = Math.round(y * 100);
    accentTone = Math.round(214 + (0.5 - x) * 30 + (0.5 - y) * 18);
  }

  onMount(() => {
    let frame = 0;
    const tick = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(updateScroll);
    };

    tick();
    window.addEventListener('resize', tick);
    window.addEventListener('scroll', tick, { passive: true });
    window.addEventListener('pointermove', updateCursor, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', tick);
      window.removeEventListener('scroll', tick);
      window.removeEventListener('pointermove', updateCursor);
    };
  });

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!email.includes('@') || submitting) return;

    submitting = true;
    errorMsg = '';

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          message: message.trim()
        })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? 'Unable to join the waitlist.');
      }

      submitted = true;
    } catch (error) {
      errorMsg = error instanceof Error ? error.message : 'Unable to join the waitlist.';
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Ssscript™ — Your Webflow AI Launchpad</title>
  <meta
    name="description"
    content="All-in-one custom code, MCP, and AI launchpad for Webflow. Get early access to agentic control, embedded knowledge, and deployment pipeline. Beta May 2026."
  />
  <meta property="og:title" content="Ssscript™ — Your Webflow AI Launchpad" />
  <meta
    property="og:description"
    content="All-in-one custom code, MCP, and AI launchpad for Webflow. Get early access to agentic control, embedded knowledge, and deployment pipeline. Beta May 2026."
  />
  <meta
    property="og:image"
    content="https://cdn.prod.website-files.com/69a96c45de5009e6ba9d7123/69b6acdde3123ef078e2b7f3_og-img.jpg"
  />
  <meta property="twitter:title" content="Ssscript™ — Your Webflow AI Launchpad" />
  <meta
    property="twitter:description"
    content="All-in-one custom code, MCP, and AI launchpad for Webflow. Get early access to agentic control, embedded knowledge, and deployment pipeline. Beta May 2026."
  />
  <meta
    property="twitter:image"
    content="https://cdn.prod.website-files.com/69a96c45de5009e6ba9d7123/69b6acdde3123ef078e2b7f3_og-img.jpg"
  />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link
    rel="stylesheet"
    href="https://cdn.prod.website-files.com/69a96c45de5009e6ba9d7123/css/ssscript.shared.96b7089e4.min.css"
    crossorigin="anonymous"
  />
  <link rel="canonical" href="https://ssscript.app" />
  <script type="module" src="https://unpkg.com/@google/model-viewer@4.0.0/dist/model-viewer.min.js"></script>
  <script type="application/ld+json">
    {JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Ssscript',
      description: 'All in one Custom Code, MCP, Ai launchpad for Webflow',
      url: '/',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Web',
      inLanguage: 'en',
      offers: [
        {
          '@type': 'Offer',
          name: 'Beta',
          price: '0',
          priceCurrency: 'EUR',
          description: 'Free 1 Month',
          availability: 'https://schema.org/PreOrder',
          availabilityStarts: '2026-04'
        },
        {
          '@type': 'Offer',
          name: 'Founders',
          description: 'One Year 50% Discount',
          availability: 'https://schema.org/PreOrder',
          availabilityStarts: '2026-05'
        },
        {
          '@type': 'Offer',
          name: 'Basic',
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: '10',
            priceCurrency: 'EUR',
            unitText: 'Month'
          },
          description: '10 Projects, All Fast Models, Limited Reasoning',
          availability: 'https://schema.org/PreOrder',
          availabilityStarts: '2026-05'
        },
        {
          '@type': 'Offer',
          name: 'Advanced',
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: '16',
            priceCurrency: 'EUR',
            unitText: 'Month'
          },
          description: 'Unlimited Projects, All Fast Models, All Reasoning',
          availability: 'https://schema.org/PreOrder',
          availabilityStarts: '2026-05'
        }
      ],
      featureList: [
        'Your Webflow AI Toolkit',
        'Complete Agentic Control',
        'Embedded Knowledge',
        'Deployment Pipeline',
        'Flexible AI Modes',
        'AI Agent Mode',
        'AI Edit Mode',
        'AI Dock Mode'
      ],
      releaseNotes: 'Beta release May 2026'
    })}
  </script>
  <script defer src="https://cloud.umami.is/script.js" data-website-id="4f6678ae-c91d-431b-92aa-2d822e34f910"></script>
  <link rel="preconnect" href="https://cdn.prod.website-files.com" crossorigin="anonymous" />
  <script>
    (function (d, h, host) {
      var deployed = 'https://ssscript-website.vercel.app/app.js';
      if (!host.endsWith('.webflow.io')) {
        var s = d.createElement('script');
        s.src = deployed;
        s.defer = 1;
        s.crossOrigin = 'anonymous';
        h.appendChild(s);
        return;
      }
      var p = d.createElement('link');
      p.rel = 'preload';
      p.as = 'script';
      p.href = deployed;
      p.crossOrigin = 'anonymous';
      h.appendChild(p);

      var l = d.createElement('script');
      l.src = 'https://localhost:6545/app.js';
      l.defer = 1;
      l.onerror = function () {
        var f = d.createElement('script');
        f.src = deployed;
        f.defer = 1;
        f.crossOrigin = 'anonymous';
        h.appendChild(f);
      };
      h.appendChild(l);
    })(document, document.head, location.hostname);
  </script>
</svelte:head>

<div class="w-embed">
  <link rel="stylesheet" href="https://ssscript-website.vercel.app/app.css" />

  <style>
    [debug] {
      visibility: hidden;
    }
  </style>
</div>

<canvas
  data-module="webgl"
  class="webgl"
  style={`--mouse-x:${mouseX}%; --mouse-y:${mouseY}%; --accent-tone:${accentTone}; --scroll:${scrollProgress};`}
></canvas>

<div class="w">
  <div class="page-w">
    <header id="hero" class="s h-screen">
      <div class="mac-bar-2">
        <div class="bar-side">
          <a href="/cogochi/showcase" aria-label="homepage" aria-current="page" class="logo-link w-inline-block w--current">
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 22 21" fill="none" class="logo xxs">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M21.1807 5C21.1807 5.55228 20.7329 6 20.1807 6H16.7646C16.2124 6 15.7646 6.44772 15.7646 7V8C15.7646 8.55228 16.2124 9 16.7646 9H20.1807C20.7329 9 21.1807 9.44772 21.1807 10V14C21.1807 14.5523 20.7329 15 20.1807 15H11.5908C11.0385 15 10.5908 15.4477 10.5908 16V17C10.5908 17.5523 11.0385 18 11.5908 18H20.1807C20.7329 18 21.1807 18.4477 21.1807 19V20C21.1807 20.5523 20.7329 21 20.1807 21H6.2959C5.74361 21 5.2959 20.5523 5.2959 20V19C5.2959 18.4477 4.84818 18 4.2959 18H1C0.447715 18 0 17.5523 0 17V16C0 15.4477 0.447715 15 1 15H1.64453C2.19682 15 2.64453 14.5523 2.64453 14V13C2.64453 12.4477 2.19682 12 1.64453 12H1C0.447715 12 0 11.5523 0 11V7C0 6.44772 0.447715 6 1 6H6.5625C7.11478 6 7.5625 5.55228 7.5625 5V4C7.5625 3.44772 7.11478 3 6.5625 3H1C0.447715 3 0 2.55228 0 2V1C0 0.447715 0.447715 0 1 0H10.7021C11.2544 0 11.7021 0.447715 11.7021 1V2C11.7021 2.55228 12.1499 3 12.7021 3H20.1807C20.7329 3 21.1807 3.44772 21.1807 4V5ZM7.99902 11C7.99902 11.5523 8.44674 12 8.99902 12H12.1816C12.7339 12 13.1816 11.5523 13.1816 11V10C13.1816 9.44772 12.7339 9 12.1816 9H8.99902C8.44674 9 7.99902 9.44772 7.99902 10V11Z" fill="currentColor"></path>
              <path fill-rule="evenodd" clip-rule="evenodd" d="M21.1807 5C21.1807 5.55228 20.7329 6 20.1807 6H16.7646C16.2124 6 15.7646 6.44772 15.7646 7V8C15.7646 8.55228 16.2124 9 16.7646 9H20.1807C20.7329 9 21.1807 9.44772 21.1807 10V14C21.1807 14.5523 20.7329 15 20.1807 15H11.5908C11.0385 15 10.5908 15.4477 10.5908 16V17C10.5908 17.5523 11.0385 18 11.5908 18H20.1807C20.7329 18 21.1807 18.4477 21.1807 19V20C21.1807 20.5523 20.7329 21 20.1807 21H6.2959C5.74361 21 5.2959 20.5523 5.2959 20V19C5.2959 18.4477 4.84818 18 4.2959 18H1C0.447715 18 0 17.5523 0 17V16C0 15.4477 0.447715 15 1 15H1.64453C2.19682 15 2.64453 14.5523 2.64453 14V13C2.64453 12.4477 2.19682 12 1.64453 12H1C0.447715 12 0 11.5523 0 11V7C0 6.44772 0.447715 6 1 6H6.5625C7.11478 6 7.5625 5.55228 7.5625 5V4C7.5625 3.44772 7.11478 3 6.5625 3H1C0.447715 3 0 2.55228 0 2V1C0 0.447715 0.447715 0 1 0H10.7021C11.2544 0 11.7021 0.447715 11.7021 1V2C11.7021 2.55228 12.1499 3 12.7021 3H20.1807C20.7329 3 21.1807 3.44772 21.1807 4V5ZM7.99902 11C7.99902 11.5523 8.44674 12 8.99902 12H12.1816C12.7339 12 13.1816 11.5523 13.1816 11V10C13.1816 9.44772 12.7339 9 12.1816 9H8.99902C8.44674 9 7.99902 9.44772 7.99902 10V11Z" fill="url(#paint0_linear_79_1465)" fill-opacity="0.2"></path>
              <defs>
                <lineargradient id="paint0_linear_79_1465" x1="10.5903" y1="0" x2="10.5903" y2="21" gradientUnits="userSpaceOnUse">
                  <stop stop-color="white"></stop>
                  <stop offset="1" stop-color="#666666"></stop>
                </lineargradient>
              </defs>
            </svg>
          </a>
          <a href="/cogochi/showcase" aria-label="homepage" aria-current="page" class="bar-txt medium w--current">Ssscript</a>
          <div class="bar-txt-w">
            <div class="bar-txt-el"><a href="#features" class="bar-txt">About</a></div>
            <div class="bar-txt-el"><a href="#hero" class="bar-txt">Waitlist</a></div>
            <div class="bar-txt-el"><a href="https://docs.ssscript.app/" target="_blank" class="bar-txt">Docs</a></div>
            <div class="bar-txt-el"><a href="#waitlist" class="bar-txt">Pricing</a></div>
          </div>
        </div>
        <div class="bar-side">
          <div class="bar-icon-w">
            <div class="sys-svg-w">
              <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 21 13" fill="none" class="svg sys">
                <path d="M5.52246 8.35303C4.55029 8.35303 3.86279 8.24561 3.35791 7.74609C2.86377 7.25195 2.76172 6.56982 2.76172 5.59229V4.10986C2.76172 3.17529 2.86914 2.48779 3.36328 1.98828C3.86279 1.49414 4.55566 1.38135 5.49023 1.38135H13.8638C14.8359 1.38135 15.5288 1.48877 16.0283 1.98828C16.5225 2.48242 16.6245 3.16992 16.6245 4.14746V5.59229C16.6245 6.56982 16.5225 7.25195 16.0283 7.74609C15.5288 8.24561 14.8359 8.35303 13.8638 8.35303H5.52246ZM5.37744 7.68701H14.0088C14.6426 7.68701 15.2119 7.59033 15.5396 7.25732C15.8672 6.92969 15.9639 6.37109 15.9639 5.7373V4.00244C15.9639 3.36328 15.8672 2.80469 15.5396 2.47705C15.2119 2.14941 14.6426 2.04736 14.0088 2.04736H5.41504C4.75439 2.04736 4.17432 2.13867 3.84668 2.47168C3.51904 2.80469 3.42773 3.37402 3.42773 4.03467V5.7373C3.42773 6.37109 3.51904 6.92969 3.84668 7.25732C4.17969 7.59033 4.74902 7.68701 5.37744 7.68701ZM5.19482 7.13379C4.71143 7.13379 4.42139 7.05859 4.23877 6.88135C4.05615 6.69336 3.98096 6.41406 3.98096 5.92529V3.84131C3.98096 3.33105 4.05615 3.03564 4.23877 2.85303C4.41064 2.67578 4.71143 2.60059 5.22705 2.60059H14.1968C14.6748 2.60059 14.9702 2.67578 15.1528 2.8584C15.3301 3.04102 15.4106 3.32568 15.4106 3.80908V5.92529C15.4106 6.40332 15.3301 6.69336 15.1475 6.88135C14.9702 7.06396 14.6802 7.13379 14.1968 7.13379H5.19482ZM17.2529 6.17773V3.56201C17.6504 3.5835 18.1875 4.09912 18.1875 4.86719C18.1875 5.64062 17.6504 6.15088 17.2529 6.17773Z" fill="currentColor"></path>
              </svg>
            </div>
            <div class="sys-svg-w">
              <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 14 14" fill="none" class="svg sys">
                <path d="M2.76172 4.56103C2.76172 2.80713 4.1875 1.38135 5.94141 1.38135C7.69531 1.38135 9.12109 2.80713 9.12109 4.56103C9.12109 5.24463 8.89844 5.87744 8.52734 6.38916L10.3125 8.17822C10.418 8.2876 10.4727 8.43213 10.4727 8.58838C10.4727 8.9126 10.2344 9.1626 9.90234 9.1626C9.75 9.1626 9.59766 9.11182 9.48828 8.99853L7.69141 7.20166C7.19141 7.5415 6.59375 7.74072 5.94141 7.74072C4.1875 7.74072 2.76172 6.31494 2.76172 4.56103ZM3.57422 4.56103C3.57422 5.86963 4.63281 6.92822 5.94141 6.92822C7.25 6.92822 8.30859 5.86963 8.30859 4.56103C8.30859 3.25244 7.25 2.19385 5.94141 2.19385C4.63281 2.19385 3.57422 3.25244 3.57422 4.56103Z" fill="currentColor"></path>
              </svg>
            </div>
            <div class="sys-svg-w">
              <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 14 14" fill="none" class="svg sys">
                <path d="M4.65625 5.05322C3.59375 5.05322 2.76172 4.31494 2.76172 3.21729C2.76172 2.11963 3.59375 1.38135 4.65625 1.38135H8.40234C9.46875 1.38135 10.3008 2.11963 10.3008 3.21729C10.3008 4.31494 9.46875 5.05322 8.40234 5.05322H4.65625ZM4.65625 4.3501H8.40234C9.05469 4.3501 9.57422 3.89307 9.57422 3.21729C9.57422 2.5415 9.05469 2.08447 8.40234 2.08447H4.65625C4.00391 2.08447 3.48828 2.5415 3.48828 3.21729C3.48828 3.89697 4.00391 4.3501 4.65625 4.3501ZM4.65625 4.09619C4.15625 4.09619 3.75 3.73682 3.75 3.21338C3.75 2.69385 4.15625 2.33447 4.65625 2.33447H5.77734C6.28125 2.33447 6.68359 2.69385 6.68359 3.21729C6.68359 3.73682 6.28125 4.09619 5.77734 4.09619H4.65625ZM4.48828 8.9751C3.52734 8.9751 2.76172 8.29932 2.76172 7.31494C2.76172 6.33057 3.52734 5.65088 4.48828 5.65088H8.57422C9.53516 5.65088 10.3008 6.33057 10.3008 7.31494C10.3008 8.29932 9.53516 8.9751 8.57422 8.9751H4.48828ZM7.45703 8.27588H8.64062C9.19531 8.27588 9.63281 7.88135 9.63281 7.31494C9.63281 6.74072 9.19531 6.3501 8.64062 6.3501H7.45703C6.91016 6.3501 6.46484 6.74072 6.46484 7.31103C6.46484 7.88135 6.91016 8.27588 7.45703 8.27588Z" fill="currentColor"></path>
              </svg>
            </div>
            <div class="sys-svg-w">
              <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 15 13" fill="none" class="svg sys">
                <path d="M3.36794 4.18213L2.82106 3.62353C2.74684 3.54541 2.74294 3.44775 2.80544 3.36963C3.74294 2.21338 5.49684 1.38135 7.31325 1.38135C9.13356 1.38135 10.8836 2.21338 11.8211 3.36963C11.8836 3.44775 11.8875 3.54541 11.8093 3.62353L11.2625 4.17041C11.1765 4.25635 11.0554 4.26025 10.9734 4.17822C10.0164 3.15478 8.74294 2.61182 7.31325 2.61182C5.89528 2.61182 4.62575 3.15088 3.66091 4.17432C3.57887 4.26416 3.44997 4.26416 3.36794 4.18213ZM5.00075 5.80713L4.38747 5.20166C4.30934 5.12744 4.30544 5.03369 4.37184 4.95557C4.97731 4.22119 6.09059 3.68603 7.31325 3.68603C8.53591 3.68603 9.64919 4.22119 10.2586 4.95557C10.3211 5.03369 10.3172 5.13135 10.2429 5.20166L9.62966 5.80322C9.53591 5.88916 9.42262 5.89307 9.3445 5.80322C8.85622 5.27978 8.0945 4.90088 7.31325 4.90478C6.53981 4.90088 5.77809 5.26807 5.30153 5.7915C5.21169 5.88525 5.0945 5.89697 5.00075 5.80713ZM7.31325 7.96728C7.2195 7.96728 7.13747 7.92041 6.98122 7.77197L6.02419 6.8501C5.95778 6.78369 5.93434 6.70166 5.98122 6.63135C6.25075 6.26807 6.75075 5.9751 7.31325 5.9751C7.86403 5.9751 8.35622 6.25244 8.62966 6.6001C8.69216 6.67822 8.67653 6.78369 8.60622 6.8501L7.64919 7.77197C7.49294 7.92432 7.41091 7.96728 7.31325 7.96728Z" fill="currentColor"></path>
              </svg>
            </div>
          </div>
          <div class="bar-txt-w">
            <div data-module="date" class="bar-txt">Sat Jun 10</div>
            <div data-module="time">9:41 AM</div>
          </div>
        </div>
      </div>

      <div class="s-cont shorter">
        <div class="h-full between">
          <hgroup data-module="hg" data-group="hero" class="hgroup main">
            <h1 class="main-h">
              <span class="darker-70">Your Webflow </span>
              <span>AI Toolkit</span>
            </h1>
            <div class="h-txt">
              Multiple agents on your Webflow project, from the
              <span class="darker-70">Designer</span>
              to
              <span class="darker-70">Custom Code.</span>
            </div>
          </hgroup>
          <hgroup data-module="hg" data-group="hero" class="to-left">
            <h2 class="main-h sm">
              <span class="darker-70">Complete</span>
              <span>Agentic Control</span>
            </h2>
            <div class="h-txt">
              Integrated with
              <span class="darker-70">Webflow MCP,</span>
              multi agent mode allows you to work on
              <span class="darker-70">multiple instances</span>
              in parallel.
            </div>
          </hgroup>
        </div>

        <div class="h-full between lower">
          <hgroup data-module="hg" data-group="hero">
            <h2 class="main-h sm">
              <span class="darker-70">Embedded </span>
              <span>Knowledge</span>
            </h2>
            <div class="h-txt">
              From
              <span class="darker-70">GSAP animation,</span>
              through custom code components and page transitions, to
              <span class="darker-70">WebGl.</span>
            </div>
          </hgroup>
          <hgroup data-module="hg" data-group="hero" class="to-right">
            <h2 class="main-h sm">
              <span class="darker-70">Deployment </span>
              <span>Pipeline</span>
            </h2>
            <div class="h-txt">
              <span class="darker-70">One click deploy,</span>
              continuous pipeline, instant rollback, and fast
              <span class="darker-70">CDN delivery.</span>
            </div>
          </hgroup>
        </div>
      </div>

      <div class="app-w">
        <div id="app-data" data-module="app" class="app-item data">
          <div data-draggable-area="" class="app-head preview">
            <div class="app-head-trigs">
              <button data-close="" aria-label="close window" class="circle opaque">
                <div class="x-icon">
                  <div class="line full x-icon rot"></div>
                  <div class="line full x-icon"></div>
                </div>
              </button>
              <div class="circle opaque"></div>
              <div class="circle opaque"></div>
            </div>
          </div>
          <div class="flex-v">
            <div class="flex-v _w-full">
              <img
                src="https://cdn.prod.website-files.com/69a96c45de5009e6ba9d7123/69ad964d951f9d17cc5a919e_logo-app.svg"
                loading="lazy"
                data-module="mouse-follow"
                alt="Ssscript App's Icon"
                class="logo app"
              />
              <div class="logo-lockup-w">
                <img
                  src="https://cdn.prod.website-files.com/69a96c45de5009e6ba9d7123/69ad96a28b06b7552a339137_logtype.svg"
                  loading="eager"
                  alt="Ssscript App logo"
                  class="logo-size"
                />
                <div class="notice-txt sm">Beta release May 2026</div>
              </div>
            </div>
            <h3 data-module="text-wave" class="data-he">Get early access</h3>
            <h2 class="data-he h2">All in one Custom Code, MCP, Ai launchpad for Webflow.</h2>
            <div class="form-element">
              <div data-module="form" class="form-w w-form">
                {#if submitted}
                  <div data-success class="form-success" style="display:flex">
                    <h2 class="data-he sm">You're In, thanks.</h2>
                    <h2 class="data-he h2 xs">
                      We'll be in touch soon.
                      <br />
                    </h2>
                    <a href="#waitlist" data-module="btn" class="form-btn static w-inline-block">
                      <div class="btn-bg gray">
                        <div class="clip-12">
                          <div>Apply for Beta?</div>
                        </div>
                      </div>
                    </a>
                    <h2 class="data-he h2 xs">
                      Or get Early founder's access
                      <br />
                    </h2>
                    <a href="#waitlist" data-module="btn" class="form-btn static w-inline-block">
                      <div class="btn-bg">
                        <div class="clip-12">
                          <div>
                            Get Founder Now
                            <span class="darker-70">350€</span>
                          </div>
                        </div>
                      </div>
                    </a>
                    <div data-url="https://web.ssscript.app/api/founders-spots-remaining" data-module="founders-spots" class="pricing-sm darker-70 is--right">
                      200 Spots Max
                    </div>
                  </div>
                {:else}
                  <form
                    id="wf-form-sign-up"
                    name="wf-form-sign-up"
                    data-name="sign-up"
                    method="get"
                    data-form=""
                    class="form"
                    data-wf-page-id="69b2dc3d81980aaf43601640"
                    data-wf-element-id="4c5736fb-5001-9c71-eaa8-239119d387ce"
                    onsubmit={handleSubmit}
                  >
                    <textarea
                      bind:value={message}
                      placeholder="Leave a Message (optional)"
                      maxlength="5000"
                      id="Message"
                      name="Message"
                      data-name="Message"
                      class="form-field taller w-input"
                    ></textarea>
                    <input
                      bind:value={name}
                      class="form-field w-input"
                      maxlength="256"
                      name="name"
                      data-name="Name"
                      placeholder="Your Name*"
                      type="text"
                      id="Name"
                      required
                    />
                    <div class="form-item">
                      <input
                        bind:value={email}
                        class="form-field w-input"
                        maxlength="256"
                        name="Email"
                        data-name="Email"
                        placeholder="Sign-up Email*"
                        type="email"
                        id="Email"
                        required
                      />
                      <button data-module="btn" class="form-btn" type="submit" disabled={submitting || !email.includes('@')}>
                        <div data-module="alpha" class="btn-bg">
                          <div class="clip-12">
                            <div>{submitting ? 'Joining...' : 'Join Waitlist'}</div>
                          </div>
                        </div>
                      </button>
                    </div>
                  </form>

                  {#if errorMsg}
                    <div data-failure class="form-fail" style="display:flex">
                      <h2 class="data-he sm">Nope :(</h2>
                      <h2 class="data-he h2 xs">
                        Something went wrong.
                        <br />
                        Try again (later maybe)?
                        <br />
                      </h2>
                    </div>
                  {/if}
                {/if}
              </div>
              <div class="notice-txt">
                <a href="https://docs.google.com/document/d/1vME2w8ZB88HoH-JyvkkiL7exrcMfWhkERfFRlnIeZFA/edit?usp=sharing" target="_blank">Privacy Policy</a>
                •
                <a href="https://docs.google.com/document/d/1vME2w8ZB88HoH-JyvkkiL7exrcMfWhkERfFRlnIeZFA/edit?usp=sharing" target="_blank">Cookie Policy</a>
                <br />
                © — All Right Reserved
                <br />
                2026
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="chart-float-layer" aria-hidden="true">
        {#each chartAssets as asset}
          <div
            class="chart-float-card"
            style={`--left:${asset.left}; --top:${asset.top}; --size:${asset.size}; --rot:${asset.rotate}; --delay:${asset.delay};`}
          >
            <img src={asset.src} alt="" class="chart-float-img" />
          </div>
        {/each}
      </div>

    </header>

      <section id="features" class="s h-screen py mobile-flip">
        <div class="app-w align-right">
          <div id="demo-video" data-module="app" class="app-item video">
            <div data-draggable-area="" class="app-head preview">
              <div class="app-head-trigs">
                <button data-close="" aria-label="close" class="circle opaque">
                  <div class="x-icon">
                    <div class="line full x-icon rot"></div>
                    <div class="line full x-icon"></div>
                  </div>
                </button>
                <div class="circle opaque"></div>
              </div>
              <div class="app-name-w">
                <div class="app-name-txt preview">video-demo.mp4</div>
              </div>
            </div>
            <div class="video-size">
              <video src="https://ssscript.dev/ssscript-website/publish-flow.mp4" autoplay muted loop playsinline class="video"></video>
            </div>
          </div>
        </div>
        <div class="c">
          <hgroup data-module="hg">
            <h2 class="main-h h1">
              <span class="darker-40">All in one</span>
              <span>App.</span>
            </h2>
            <div class="h-txt">
              The swiss-army knife for
              <span class="darker-70">AI Agent</span>
              in your Webflow project.
            </div>
            <div class="div-block-12">
              <div class="hg-par darker-40">Contextual Awareness</div>
              <div class="h-txt">
                Connect to the
                <span class="darker-70">MCP</span>
                to give the Agents the full context on your build.
              </div>
              <div class="hg-par darker-40">Agent Swarms</div>
              <div class="h-txt">
                Use
                <span class="darker-70">multiple agents in parallel</span>
                to add custom code, animations, and functionality.
              </div>
              <div class="hg-par darker-40">Development Setup</div>
              <div class="h-txt">
                Leverage fast
                <span class="darker-70">Bun</span>
                based builds, and live reload of your
                <span class="darker-70">custom code.</span>
              </div>
              <div class="hg-par darker-40">One-click Deploy</div>
              <div class="h-txt">
                <span class="darker-70">Click and deploy</span>
                your AI written custom code to make it available to all users visiting your website.
              </div>
            </div>
          </hgroup>
        </div>
      </section>

      <section class="s">
        <div class="c _w-60">
          <hgroup data-module="hg" class="ho">
            <h2 class="main-h h1">
              <span class="darker-40">Flexible</span>
              <span>AI Modes.</span>
            </h2>
            <div class="h-txt">
              Different
              <span class="darker-70">modes</span>
              and
              <span class="darker-70">models</span>
              for different tasks.
            </div>
          </hgroup>
        </div>
        <div class="c full">
          <div class="w-dyn-list">
            <div data-module="slider" role="list" class="slider w-dyn-items">
              {#each featureSlides as slide}
                <div role="listitem" class="slide-w w-dyn-item">
                  <div class="video-cut">
                    <div class="video-screen">
                      <video src={slide.src} autoplay playsinline muted loop class="video-el"></video>
                    </div>
                  </div>
                  <hgroup class="slide-he-w">
                    <h3 data-title="" class="slide-he">{slide.title}</h3>
                  </hgroup>
                </div>
              {/each}
            </div>
          </div>
        </div>
        <div class="webgl-target-w">
          <div data-scale="1, 0.6" data-module="webgl-target" class="webgl-target"></div>
        </div>
      </section>

      <section id="waitlist" class="s h-screen py mobile-space">
        <div class="c ve">
          <hgroup data-module="hg">
            <h2 class="main-h h1">
              <span class="darker-40">Frequently</span>
              <span class="darker-70">Asked</span>
              <span>Questions</span>
            </h2>
            <div class="h-txt">
              <span class="darker-70">Detailed overview</span>
              of features, functionality and inner workings.
            </div>
          </hgroup>
          <a href="https://docs.ssscript.app/" target="_blank" class="ft-link w-inline-block">
            <button data-module="btn" class="form-btn static">
              <div data-module="alpha" class="btn-bg gray">
                <div class="clip-12">
                  <div>Complete Docs</div>
                </div>
              </div>
            </button>
          </a>
        </div>
        <div class="app-w mail">
          <div id="faq-item" data-module="app" class="app-item mail">
            <div data-draggable-area="" class="app-head preview">
              <div class="app-head-trigs">
                <button data-close="" aria-label="close" class="circle opaque">
                  <div class="x-icon">
                    <div class="line full x-icon rot"></div>
                    <div class="line full x-icon"></div>
                  </div>
                </button>
                <div class="circle opaque"></div>
              </div>
              <div class="app-name-w">
                <div class="app-name-txt preview">FAQs</div>
              </div>
            </div>
            <div class="mail-app">
              <div>
                <div class="mail-wrapper w-dyn-list">
                  <div data-css="fade-tb" data-module="mail-list" role="list" class="mail-list w-dyn-items">
                    {#each faqItems as item, index}
                      <div role="listitem" class="mail-slide w-dyn-item">
                        <button
                          type="button"
                          class="mail-item mail-item-btn"
                          class:current={index === selectedFaq}
                          onclick={() => (selectedFaq = index)}
                        >
                          <div data-unread="" class="unread-email">
                            <div class="dot relative email"></div>
                          </div>
                          <div class="mail-head">
                            <div class="mail-p normal darker">{item.from}</div>
                            <div class="mail-p">{item.question}</div>
                          </div>
                        </button>
                      </div>
                    {/each}
                  </div>
                </div>
              </div>
              <div class="mail-rel-wrap">
                <div class="collection-list-wrapper w-dyn-list">
                  <div data-module="mail-view" role="list" class="collection-list w-dyn-items">
                    <div role="listitem" class="mail-view w-dyn-item">
                      <div class="mail-size">
                        <div class="mail-head-w">
                          <div class="mail-img-w"></div>
                          <div class="mail-head">
                            <div class="mail-p normal">{faqItems[selectedFaq].from}</div>
                            <div class="div-block-7">
                              <div class="mail-p smaller">
                                <span class="darker">Reply-To</span>
                              </div>
                              <div class="mail-p">{faqItems[selectedFaq].question}</div>
                            </div>
                          </div>
                        </div>
                        <div class="line ho darker"></div>
                        <div class="mail-body">
                          <div class="mail-rt w-richtext">
                            <p>{faqItems[selectedFaq].answer}</p>
                          </div>
                        </div>
                        <div class="darker sm">Sent from my iPhone</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      <div
        class="hero-orbit-shell"
        aria-hidden="true"
        style={`--orbit-x:${(scrollProgress - 0.5) * 22}rem; --orbit-y:${(0.5 - scrollProgress) * 12}rem; --orbit-rot:${(scrollProgress - 0.5) * 18}deg; --orbit-scale:${1 + scrollProgress * 0.06};`}
      >
          <model-viewer
            src="/cogochi/logo.glb"
            class="hero-anchor"
            alt=""
            camera-orbit="0deg 75deg 2.7m"
            field-of-view="24deg"
            interaction-prompt="none"
            shadow-intensity="0"
            environment-image="neutral"
            loading="eager"
          ></model-viewer>
      </div>
        <div class="webgl-target-w">
          <div data-module="webgl-target" class="webgl-target short"></div>
        </div>
      </section>

      <footer class="s footer">
        <div class="c footer-col">
          <div class="div-block-9">
            <div class="div-block-2">
              <img data-module="mouse-follow" loading="lazy" alt="Ssscript App's Icon" src="https://cdn.prod.website-files.com/69a96c45de5009e6ba9d7123/69ad964d951f9d17cc5a919e_logo-app.svg" class="logo app footer" />
              <img loading="lazy" src="https://cdn.prod.website-files.com/69a96c45de5009e6ba9d7123/69ad96a28b06b7552a339137_logtype.svg" alt="Ssscript App logo" class="logo-size" />
            </div>
            <div class="footer-notice mt">
              © 2026
              <a href="https://federic.ooo/" target="_blank">‍</a>
              — Federico Valla
            </div>
          </div>
          <div class="footer-cols">
            <div class="div-block-3">
              <h2 class="footer-list-he">Navigate</h2>
              <ul data-group="hero" data-module="list" role="list" class="w-list-unstyled">
                <li><a data-module="link" href="https://docs.ssscript.app/" target="_blank" class="ft-link w-inline-block"><div class="clip-12"><div>Docs</div></div></a></li>
                <li><a data-module="link" href="#hero" class="ft-link w-inline-block"><div class="clip-12"><div>Waitlist</div></div></a></li>
                <li><a data-module="link" href="#hero" class="ft-link w-inline-block"><div class="clip-12"><div>Pricing</div></div></a></li>
                <li><a data-module="link" href="#features" class="ft-link w-inline-block"><div class="clip-12"><div>Features</div></div></a></li>
                <li><a data-module="link" href="#features" class="ft-link w-inline-block"><div class="clip-12"><div>Demo</div></div></a></li>
              </ul>
            </div>
            <div class="div-block-3">
              <h2 data-module="text-wave" class="footer-list-he">Connect</h2>
              <ul data-group="hero" data-module="list" role="list" class="w-list-unstyled">
                <li><a data-module="link" href="https://federic.ooo/s/twitter" target="_blank" class="ft-link w-inline-block"><div class="clip-12"><div>Twitter</div></div></a></li>
                <li><a data-module="link" href="https://federic.ooo/s/instagram" target="_blank" class="ft-link w-inline-block"><div class="clip-12"><div>Instagram</div></div></a></li>
                <li><a data-module="link" href="https://www.federic.ooo/s/github" target="_blank" class="ft-link w-inline-block"><div class="clip-12"><div>Github</div></div></a></li>
                <li><a data-module="link" href="https://federic.ooo/" target="_blank" class="ft-link w-inline-block"><div class="clip-12"><div>Portfolio</div></div></a></li>
              </ul>
            </div>
          </div>
        </div>
        <div class="c footer-col">
          <div class="footer-notice mt">
            <a href="https://docs.google.com/document/d/1vME2w8ZB88HoH-JyvkkiL7exrcMfWhkERfFRlnIeZFA/edit?usp=sharing" target="_blank">Privacy Policy</a>
            &amp;
            <a href="https://docs.google.com/document/d/1vME2w8ZB88HoH-JyvkkiL7exrcMfWhkERfFRlnIeZFA/edit?usp=sharing" target="_blank">Terms of Usage</a>
          </div>
        </div>
      </footer>

  </div>
</div>

<style>
  :global(html) {
    -webkit-text-size-adjust: 100%;
    -ms-text-size-adjust: 100%;
    height: 100%;
  }

  :global(body) {
    margin: 0;
    min-height: 100%;
    background: #000;
    color: #fefefe;
    font-family: Instrumentsans, Arial, sans-serif;
  }

  :global(*) {
    box-sizing: border-box;
    user-select: none;
  }

  :global(a) {
    color: inherit;
    text-decoration: none;
  }

  :global(img),
  :global(svg),
  :global(video) {
    pointer-events: none;
  }

  .mail-item-btn {
    appearance: none;
    background: transparent;
    border: 0;
    padding: 0;
    width: 100%;
    text-align: inherit;
  }

  .webgl {
    background:
      radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(255, 255, 255, 0.04), transparent 18%),
      radial-gradient(circle at calc(100% - var(--mouse-x)) calc(100% - var(--mouse-y)), hsla(var(--accent-tone), 24%, 55%, 0.12), transparent 20%),
      linear-gradient(#111, #000);
    width: 100%;
    height: 100%;
    position: fixed;
    inset: 0;
  }

  .chart-float-layer {
    position: absolute;
    inset: 3rem 0 0;
    z-index: 0;
    pointer-events: none;
  }

  .hero-orbit-shell {
    position: absolute;
    left: 50%;
    top: 46%;
    z-index: 0;
    transform: translate(-50%, -50%);
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.34;
    will-change: transform;
    transform:
      translate(-50%, -50%)
      translate3d(var(--orbit-x), var(--orbit-y), 0)
      rotate(var(--orbit-rot))
      scale(var(--orbit-scale));
    filter: drop-shadow(0 26px 60px rgba(0, 0, 0, 0.52));
  }

  .hero-anchor {
    width: min(44vw, 34rem);
    aspect-ratio: 1;
    background: transparent !important;
    border: 0;
    outline: 0;
    box-shadow: none;
    --poster-color: transparent;
  }

  .chart-float-card {
    position: absolute;
    left: var(--left);
    top: var(--top);
    width: var(--size);
    transform: translate3d(-50%, -50%, 0) rotate(var(--rot));
    opacity: 0.96;
    filter: drop-shadow(0 18px 36px rgba(0, 0, 0, 0.45));
    animation: chart-float 9s ease-in-out infinite;
    animation-delay: var(--delay);
  }

  .chart-float-img {
    display: block;
    width: 100%;
    height: auto;
  }

  :global(.mac-bar-2) {
    position: fixed;
    inset: 0 0 auto;
    z-index: 1000;
    height: 2.4em;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-left: 0.6rem;
    padding-right: 0.6rem;
    background: #000;
    color: #fefefe !important;
    mix-blend-mode: normal;
    isolation: isolate;
    filter: none;
    opacity: 1 !important;
  }

  :global(.mac-bar-2 a),
  :global(.mac-bar-2 .bar-txt),
  :global(.mac-bar-2 .bar-txt.medium),
  :global(.mac-bar-2 .bar-side),
  :global(.mac-bar-2 .bar-icon-w),
  :global(.mac-bar-2 .sys-svg-w),
  :global(.mac-bar-2 .logo-link),
  :global(.mac-bar-2 svg) {
    color: #fefefe !important;
    fill: currentColor !important;
    opacity: 1 !important;
    filter: none !important;
    text-shadow: none !important;
    -webkit-text-fill-color: #fefefe !important;
  }

  :global(.mac-bar-2 .bar-txt) {
    font-size: 12px;
    font-weight: 500;
    color: #fefefe !important;
  }

  :global(.mac-bar-2 .bar-txt.medium) {
    font-weight: 700;
    color: #fefefe !important;
  }

  :global(.mac-bar-2 .bar-txt-w) {
    gap: 1rem;
  }

  :global(.mac-bar-2 .bar-icon-w) {
    gap: 0.5rem;
  }

  :global(.mac-bar-2 .logo.xxs) {
    width: 1.3em;
  }

  :global(.mac-bar-2 .clip-12 > div),
  :global(.mac-bar-2 .bar-txt-w > div),
  :global(.mac-bar-2 .bar-txt-el),
  :global(.mac-bar-2 .bar-txt-el > a),
  :global(.mac-bar-2 .bar-txt-el > a > div) {
    color: #fefefe !important;
    opacity: 1 !important;
    filter: none !important;
    -webkit-text-fill-color: #fefefe !important;
    text-shadow: none !important;
  }

  :global(.mac-bar-2 [data-module='link']),
  :global(.mac-bar-2 [aria-label='homepage']) {
    color: #fefefe !important;
    opacity: 1 !important;
  }

  @keyframes chart-float {
    0%,
    100% {
      transform: translate3d(-50%, -50%, 0) rotate(var(--rot)) translateY(0);
    }
    50% {
      transform: translate3d(-50%, -50%, 0) rotate(calc(var(--rot) + 2deg)) translateY(-10px);
    }
  }

  @media (max-width: 1024px) {
    .hero-orbit-shell {
      width: min(52vw, 28rem);
      top: 48%;
      opacity: 0.36;
    }

    .hero-anchor {
      width: min(52vw, 28rem);
    }

    .chart-float-layer {
      inset: 4rem 0 0;
    }

    .chart-float-card {
      opacity: 0.84;
    }
  }

  @media (max-width: 767px) {
    .hero-orbit-shell {
      display: none;
    }

    .chart-float-layer {
      display: none;
    }
  }
</style>
