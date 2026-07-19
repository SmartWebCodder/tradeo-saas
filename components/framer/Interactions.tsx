"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Replaces the Framer runtime for the statically rebuilt cryptoclay pages:
 *  - appear-on-scroll animations ([data-appear], resting state baked at build)
 *  - ticker marquees (uls of li.ticker-item)
 *  - FAQ accordions ([data-faq], answers grafted at build)
 *  - mobile nav open/close + scrolled nav variant (Framer variant classes:
 *    Desktop 17b949j / Scroll 1210ham / Mobile Closed axpapf / Mobile Open bvryy0)
 *  - .hover variant class for elements styled via ".hover" rules
 */
export default function Interactions() {
  const pathname = usePathname();

  useEffect(() => {
    const cleanups: Array<() => void> = [];

    /* ---- appear animations ---- */
    const io = new IntersectionObserver(
      (entries) => {
        entries
          .filter((e) => e.isIntersecting)
          .forEach((entry, i) => {
            const el = entry.target as HTMLElement;
            io.unobserve(el);
            const target = el.getAttribute("data-appear-to") || "none";
            const opacity = el.getAttribute("data-appear-o") || "1";
            window.setTimeout(() => {
              el.style.opacity = opacity;
              el.style.transform = target;
              const f = el.getAttribute("data-appear-f");
              if (f) el.style.filter = f;
              el.setAttribute("data-appeared", "");
            }, Math.min(i, 6) * 90);
          });
      },
      { threshold: 0.05, rootMargin: "250px 0px 250px 0px" }
    );
    document
      .querySelectorAll<HTMLElement>("[data-appear]:not([data-appeared])")
      .forEach((el) => io.observe(el));
    // safety net: reveal anything still shipped hidden that tagging missed
    document.querySelectorAll<HTMLElement>('[style*="opacity"]').forEach((el) => {
      if (el.hasAttribute("data-appear")) return;
      const v = parseFloat(el.style.opacity);
      if (isNaN(v) || v > 0.05) return;
      el.setAttribute("data-appear", "");
      el.setAttribute("data-appear-o", "1");
      el.setAttribute("data-appear-to", el.style.transform && el.style.transform !== "none" ? el.style.transform : "none");
      io.observe(el);
    });
    cleanups.push(() => io.disconnect());

    /* ---- ticker marquees ---- */
    const VELOCITY = 70; // px/s
    const startMarquee = (track: HTMLElement) => {
      if (track.dataset.cxMarquee) return;
      const baseWidth = track.scrollWidth;
      if (baseWidth === 0) {
        const ro = new ResizeObserver(() => {
          if (track.scrollWidth > 0) {
            ro.disconnect();
            startMarquee(track);
          }
        });
        ro.observe(track);
        cleanups.push(() => ro.disconnect());
        return;
      }
      track.dataset.cxMarquee = "1";
      track.style.opacity = "1";
      track.style.transform = "none";
      track.style.justifyContent = "flex-start";
      const gap = parseFloat(getComputedStyle(track).columnGap) || 24;
      const items = Array.from(track.children) as HTMLElement[];
      if (!items.length) return;
      let host: HTMLElement | null = track.parentElement;
      while (host && host.clientWidth === 0) host = host.parentElement;
      const hostWidth = host ? host.clientWidth : window.innerWidth;
      let width = baseWidth;
      while (width < hostWidth + baseWidth * 2) {
        for (const it of items) track.appendChild(it.cloneNode(true));
        width += baseWidth + gap;
      }
      const dist = baseWidth + gap;
      track.style.setProperty("--cx-marquee-dist", `${dist}px`);
      track.style.setProperty("--cx-marquee-duration", `${dist / VELOCITY}s`);
      track.classList.add("cx-marquee-track");
      const parent = track.parentElement;
      if (parent) parent.style.overflow = "hidden";
    };
    document.querySelectorAll<HTMLElement>("li.ticker-item").forEach((li) => {
      const ul = li.parentElement;
      if (ul) startMarquee(ul);
    });
    document
      .querySelectorAll<HTMLElement>('section.framer-slideshow ul, [data-framer-name*="Ticker"] ul, [data-framer-name*="Marquee"] ul')
      .forEach((ul) => startMarquee(ul));

    /* ---- hero particle layer (original renders these via Framer JS) ---- */
    document.querySelectorAll<HTMLElement>('section[data-framer-name="Hero"]').forEach((hero) => {
      if (hero.querySelector(".cx-particles")) return;
      const layer = document.createElement("div");
      layer.className = "cx-particles";
      for (let i = 0; i < 70; i++) {
        const d = document.createElement("span");
        d.style.left = Math.random() * 100 + "%";
        d.style.top = Math.random() * 100 + "%";
        d.style.animationDelay = Math.random() * 6 + "s";
        d.style.animationDuration = 3 + Math.random() * 5 + "s";
        const size = Math.random() < 0.85 ? 2 : 3;
        d.style.width = d.style.height = size + "px";
        layer.appendChild(d);
      }
      hero.prepend(layer);
    });

    /* ---- "Your Journey" scroll-jack: sticky visual swaps per step ---- */
    document.querySelectorAll<HTMLElement>('[data-framer-name="Process Desktop"]').forEach((pd) => {
      const layers = ["process 1", "process 2", "process 3"].map((n) =>
        pd.querySelector<HTMLElement>(`[data-framer-name="${n}"]`)
      );
      if (!layers[0]) return;
      const card = pd.querySelector<HTMLElement>('[data-framer-name="Process Card"]');
      const cardSteps = card ? (Array.from(card.children) as HTMLElement[]) : [];
      const bar = pd.querySelector<HTMLElement>('[data-framer-name="Progress Bar"]');
      const indicator = bar ? (bar.firstElementChild as HTMLElement | null) : null;
      let cur = -1;
      const onScroll = () => {
        const r = pd.getBoundingClientRect();
        const total = Math.max(r.height - window.innerHeight * 0.8, 1);
        const y = Math.min(Math.max(-r.top, 0), total);
        const p = y / total;
        // slide the gradient indicator top-to-bottom (matches the original:
        // beam starts lifted by ~track height and settles at its natural spot)
        if (bar && indicator) {
          const travel = Math.max(bar.clientHeight - 71, 0);
          indicator.style.transform = `translateY(${(p - 1) * travel}px)`;
        }
        const idx = Math.min(2, Math.floor(p * 3));
        if (idx === cur) return;
        cur = idx;
        layers.forEach((l, i) => {
          if (!l) return;
          l.style.transition = "opacity 0.5s ease";
          l.style.opacity = i === idx ? "1" : "0";
        });
        cardSteps.forEach((st, i) => st.classList.toggle("cx-active", i === idx));
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
      cleanups.push(() => window.removeEventListener("scroll", onScroll));
    });

    /* ---- FAQ accordions ---- */
    document.querySelectorAll<HTMLElement>("[data-faq]").forEach((item) => {
      const onClick = () => {
        const group = item.closest("section") || document;
        const wasOpen = item.classList.contains("cx-open");
        group
          .querySelectorAll<HTMLElement>("[data-faq].cx-open")
          .forEach((other) => other.classList.remove("cx-open"));
        if (!wasOpen) item.classList.add("cx-open");
      };
      item.addEventListener("click", onClick);
      cleanups.push(() => item.removeEventListener("click", onClick));
    });

    /* ---- mobile/tablet nav toggle (Framer variant pairs) ---- */
    const NAV_PAIRS: Array<[string, string]> = [
      ["framer-v-zanm61", "framer-v-11uxdt1"],   // Phone
      ["framer-v-144jngr", "framer-v-1gq5smc"],  // Phone - Black
      ["framer-v-1bk1vn4", "framer-v-oipwzh"],   // Tablet
      ["framer-v-s7nnkz", "framer-v-9ssidy"],    // Tablet - Black
    ];
    document.querySelectorAll<HTMLElement>("nav.framer-udjb5").forEach((nav) => {
      const btn = nav.querySelector<HTMLElement>("[data-highlight], button");
      if (!btn) return;
      const toggle = () => {
        for (const [closed, open] of NAV_PAIRS) {
          if (nav.classList.contains(closed)) { nav.classList.replace(closed, open); return; }
          if (nav.classList.contains(open)) { nav.classList.replace(open, closed); return; }
        }
      };
      btn.addEventListener("click", toggle);
      cleanups.push(() => btn.removeEventListener("click", toggle));
      nav.querySelectorAll("a").forEach((a) => {
        const close = () => {
          for (const [closed, open] of NAV_PAIRS) {
            if (nav.classList.contains(open)) nav.classList.replace(open, closed);
          }
        };
        a.addEventListener("click", close);
        cleanups.push(() => a.removeEventListener("click", close));
      });
    });


    /* ---- hover variant class ---- */
    document.querySelectorAll<HTMLElement>("[data-highlight]").forEach((el) => {
      if (el.closest("nav.framer-udjb5")) return; // nav items: no hover roll
      const enter = () => el.classList.add("hover");
      const leave = () => el.classList.remove("hover");
      el.addEventListener("pointerenter", enter);
      el.addEventListener("pointerleave", leave);
      cleanups.push(() => {
        el.removeEventListener("pointerenter", enter);
        el.removeEventListener("pointerleave", leave);
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, [pathname]);

  return null;
}
