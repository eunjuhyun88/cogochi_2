/** Svelte action: fade-up entrance animation triggered by IntersectionObserver. */
export function revealOnScroll(
  node: HTMLElement,
  options?: { delay?: number; threshold?: number; distance?: number }
): { destroy: () => void } {
  const delay = options?.delay ?? 0;
  const threshold = options?.threshold ?? 0.15;
  const dist = options?.distance ?? 40;

  // Respect reduced motion
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return { destroy: () => {} };
  }

  node.style.opacity = '0';
  node.style.transform = `translateY(${dist}px)`;
  node.style.transition = `opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`;

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        node.style.opacity = '1';
        node.style.transform = 'translateY(0)';
        observer.disconnect();
      }
    },
    { threshold }
  );

  observer.observe(node);
  return { destroy: () => observer.disconnect() };
}
