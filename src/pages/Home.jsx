import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import '../styles/home.css'
import testimonialAvatar1 from '../assets/testimonial-avatar.png'
import testimonialAvatar2 from '../assets/testimonial-avatar-2.png'
import testimonialAvatar3 from '../assets/testimonial-avatar-3.png'

gsap.registerPlugin(ScrollTrigger)

const frameModules = import.meta.glob(
  '../assets/sequence/ezgif-frame-*.jpg',
  { eager: true, as: 'url' }
)

const FRAMES = Object.keys(frameModules)
  .sort()
  .map((key) => frameModules[key])

const TOTAL_FRAMES = FRAMES.length

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false)
  const canvasRef       = useRef(null)
  const spacerRef       = useRef(null)
  const imagesRef       = useRef([])
  const frameIdxRef     = useRef(0)

  // Intro refs
  const introOverlayRef = useRef(null)
  const introBrandRef   = useRef(null)

  // UI refs
  const navRef          = useRef(null)
  const heroRef         = useRef(null)

  // About panel — fixed over canvas
  const aboutRef        = useRef(null)
  // Testimonial panel — fixed over canvas
  const testimonialRef  = useRef(null)
  // Clients panel — fixed over canvas
  const clientsRef      = useRef(null)
  // Contact panel — fixed over canvas
  const contactRef      = useRef(null)

  useEffect(() => {
    // ── Immediately lock panels off-screen before any render ──
    // macOS Genie zoom: starts small from bottom-right corner
    gsap.set(aboutRef.current, { x: '35vw', y: '35vh', scale: 0.15, opacity: 0, transformOrigin: 'right bottom' })
    gsap.set(testimonialRef.current, { opacity: 0 })
    gsap.set(clientsRef.current, { scale: 1.3, opacity: 0 })
    gsap.set(contactRef.current, { x: '-100vw', opacity: 0 })

    // ── Pre-load frames in batches so main thread isn't blocked ──
    const images = new Array(TOTAL_FRAMES)
    imagesRef.current = images

    let i = 0
    function loadBatch() {
      const end = Math.min(i + 20, TOTAL_FRAMES)
      while (i < end) {
        const img = new Image()
        img.src = FRAMES[i]
        images[i] = img
        i++
      }
      if (i < TOTAL_FRAMES) {
        // yield to browser between batches
        ;(window.requestIdleCallback || window.setTimeout)(loadBatch)
      }
    }
    loadBatch()

    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')

    const setSize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
      drawFrame(frameIdxRef.current)
    }
    setSize()
    window.addEventListener('resize', setSize)

    function drawFrame(idx) {
      const img = imagesRef.current[idx]
      if (!img) return
      const render = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        const scale = Math.max(
          canvas.width  / img.naturalWidth,
          canvas.height / img.naturalHeight
        )
        const w = img.naturalWidth  * scale
        const h = img.naturalHeight * scale
        const x = (canvas.width  - w) / 2
        const y = (canvas.height - h) / 2
        ctx.drawImage(img, x, y, w, h)
      }
      img.complete ? render() : (img.onload = render)
    }

    drawFrame(0)

    // ── Scroll → frame scrub (full 600vh) ──
    ScrollTrigger.create({
      trigger: spacerRef.current,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5,
      onUpdate: (self) => {
        const idx = Math.round(self.progress * (TOTAL_FRAMES - 1))
        if (idx !== frameIdxRef.current) {
          frameIdxRef.current = idx
          drawFrame(idx)
        }
      },
    })

    // ── Hero fades out first 12% of scroll ──
    ScrollTrigger.create({
      trigger: spacerRef.current,
      start: 'top top',
      end: '12% top',
      scrub: true,
      onUpdate: (self) => {
        gsap.set(heroRef.current, {
          opacity: 1 - self.progress,
          y: -self.progress * 40,
        })
      },
    })

    // ── About panel: macOS Genie Zoom IN from bottom-right ──
    gsap.to(aboutRef.current, {
      x: '0vw',
      y: '0vh',
      scale: 1,
      opacity: 1,
      transformOrigin: 'right bottom',
      ease: 'power2.out',
      immediateRender: false,
      scrollTrigger: {
        trigger: spacerRef.current,
        start: '12% top',
        end: '19% top',
        scrub: 1,
      },
    })

    // ── About panel: macOS Genie Minimize OUT to bottom-left ──
    gsap.to(aboutRef.current, {
      x: '-35vw',
      y: '35vh',
      scale: 0.15,
      opacity: 0,
      transformOrigin: 'left bottom',
      ease: 'power2.in',
      immediateRender: false,
      scrollTrigger: {
        trigger: spacerRef.current,
        start: '23% top',
        end: '30% top',
        scrub: 1,
      },
    })

    // ── About panel: Toggle pointerEvents active window ──
    ScrollTrigger.create({
      trigger: spacerRef.current,
      start: '14% top',
      end: '28% top',
      onToggle: (self) => {
        gsap.set(aboutRef.current, { pointerEvents: self.isActive ? 'all' : 'none' })
      }
    })

    // ── Testimonials: Staggered Pop-up from center ──
    // First, animate wrapper opacity so it's fully visible
    gsap.to(testimonialRef.current, {
      opacity: 1,
      scrollTrigger: {
        trigger: spacerRef.current,
        start: '30% top',
        end: '32% top',
        scrub: 1,
      }
    })

    gsap.to('.testimonial-card', {
      scale: 1,
      opacity: 1,
      y: 0,
      stagger: 0.08,
      ease: 'power2.out',
      immediateRender: false,
      scrollTrigger: {
        trigger: spacerRef.current,
        start: '30% top',
        end: '38% top',
        scrub: 1,
      },
    })

    // ── Testimonials: Pop Down (Opposite stagger order) ──
    gsap.to('.testimonial-card', {
      scale: 0.7,
      opacity: 0,
      y: 40,
      stagger: { each: 0.05, from: 'end' },
      ease: 'power2.in',
      immediateRender: false,
      scrollTrigger: {
        trigger: spacerRef.current,
        start: '43% top',
        end: '51% top',
        scrub: 1,
      },
    })

    gsap.to(testimonialRef.current, {
      opacity: 0,
      scrollTrigger: {
        trigger: spacerRef.current,
        start: '49% top',
        end: '51% top',
        scrub: 1,
      }
    })

    // ── Testimonials: Toggle pointerEvents active window ──
    ScrollTrigger.create({
      trigger: spacerRef.current,
      start: '32% top',
      end: '49% top',
      onToggle: (self) => {
        gsap.set(testimonialRef.current, { pointerEvents: self.isActive ? 'all' : 'none' })
      }
    })

    // ── Clients panel: Zoom IN from large ──
    gsap.to(clientsRef.current, {
      scale: 1,
      opacity: 1,
      ease: 'power2.out',
      immediateRender: false,
      scrollTrigger: {
        trigger: spacerRef.current,
        start: '51% top',
        end: '57% top',
        scrub: 1,
      },
    })

    // ── Clients panel: Minimize/Scale OUT ──
    gsap.to(clientsRef.current, {
      scale: 0.8,
      opacity: 0,
      ease: 'power2.in',
      immediateRender: false,
      scrollTrigger: {
        trigger: spacerRef.current,
        start: '62% top',
        end: '68% top',
        scrub: 1,
      },
    })

    // ── Clients panel: Toggle pointerEvents active window ──
    ScrollTrigger.create({
      trigger: spacerRef.current,
      start: '54% top',
      end: '62% top',
      onToggle: (self) => {
        gsap.set(clientsRef.current, { pointerEvents: self.isActive ? 'all' : 'none' })
      }
    })

    // ── Contact form: Slide IN horizontally from left ──
    gsap.to(contactRef.current, {
      x: '0vw',
      opacity: 1,
      ease: 'power2.out',
      immediateRender: false,
      scrollTrigger: {
        trigger: spacerRef.current,
        start: '68% top',
        end: '78% top',
        scrub: 1,
      },
    })

    // ── Contact form: Slide OUT horizontally to right ──
    gsap.to(contactRef.current, {
      x: '100vw',
      opacity: 0,
      ease: 'power2.in',
      immediateRender: false,
      scrollTrigger: {
        trigger: spacerRef.current,
        start: '90% top',
        end: '100% top',
        scrub: 1,
      },
    })

    // ── Contact form: Toggle pointerEvents active window ──
    ScrollTrigger.create({
      trigger: spacerRef.current,
      start: '72% top',
      end: '90% top',
      onToggle: (self) => {
        gsap.set(contactRef.current, { pointerEvents: self.isActive ? 'all' : 'none' })
      }
    })


    // ── INTRO → FADE → REVEAL timeline ──
    const tl = gsap.timeline({ delay: 0.1 })

    tl.fromTo(
      '.intro-brand .char',
      { color: '#44444a', filter: 'blur(2px)', scale: 1.05 },
      { color: '#ffffff', filter: 'blur(0px)', scale: 1, duration: 0.5, stagger: { each: 0.03, from: 'end' }, ease: 'power2.out' }
    )
    tl.fromTo(
      '.intro-tagline',
      { opacity: 0, y: 5 },
      { opacity: 0.5, y: 0, duration: 0.3, ease: 'power2.out' },
      '-=0.2'
    )
    tl.to({}, { duration: 0.1 })
    tl.to(
      introOverlayRef.current,
      { yPercent: -100, opacity: 0, duration: 0.5, ease: 'power3.inOut' },
      'reveal'
    )
    tl.fromTo(
      navRef.current,
      { opacity: 0, scale: 1.15, y: -15 },
      { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'power3.out' },
      '-=0.2'
    )
    tl.fromTo(
      heroRef.current,
      { opacity: 0, scale: 1.15, filter: 'blur(4px)' },
      { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.6, ease: 'power3.out' },
      '-=0.3'
    )
    tl.set(introOverlayRef.current, { display: 'none' })

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill())
      window.removeEventListener('resize', setSize)
    }
  }, [])

  return (
    <>
      {/* ── FIXED CANVAS — always behind everything ── */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0, left: 0,
          width: '100vw',
          height: '100vh',
          display: 'block',
          zIndex: 0,
        }}
      />

      {/* ── INTRO OVERLAY ── */}
      <div ref={introOverlayRef} className="intro-overlay">
        <div ref={introBrandRef} className="intro-brand-wrap">
          <span className="intro-brand">
            {Array.from("EVANGELION").map((char, index) => (
              <span key={index} className="char">{char}</span>
            ))}
          </span>
          <span className="intro-tagline">SaaS &amp; ERP Development Studio</span>
        </div>
      </div>

      {/* ── NAVBAR ── */}
      <nav ref={navRef} className={`navbar ${menuOpen ? 'menu-open' : ''}`} style={{ opacity: 0 }}>
        <div className="nav-top">
          <a className="nav-brand" href="/">EVANGELION</a>
          <button 
            className={`nav-hamburger ${menuOpen ? 'active' : ''}`} 
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle Menu"
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        </div>
        <div className={`nav-menu-wrap ${menuOpen ? 'show' : ''}`}>
          <div className="nav-links">
            <a href="#features" className="nav-link" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#pricing"  className="nav-link" onClick={() => setMenuOpen(false)}>Pricing</a>
            <a href="#about"    className="nav-link" onClick={() => setMenuOpen(false)}>About</a>
            <a href="#contact"  className="nav-cta" onClick={() => setMenuOpen(false)}>Get Started →</a>
          </div>
        </div>
      </nav>

      {/* ── HERO — fixed, fades out on scroll ── */}
      <div ref={heroRef} className="hero-fixed" style={{ opacity: 0 }}>
        <div className="hero-inner">
          <p className="hero-eyebrow">Introducing Evangelion</p>
          <h1 className="hero-title">
            Custom SaaS &amp;<br />
            <span className="hero-gradient">ERP Solutions</span>
          </h1>
          <p className="hero-sub">
            We build high-performance billing systems, enterprise dashboards,<br />
            and custom software that automate operations and accelerate growth.
          </p>
          <div className="hero-ctas">
            <a href="#contact" className="btn-primary">Get Started Now</a>
            <a href="#about"  className="btn-ghost">Learn More ↗</a>
          </div>
          <div className="hero-badges">
            <span className="badge">✦ Automated Billing</span>
            <span className="badge">✦ Custom ERP Modules</span>
            <span className="badge">✦ Gamharia &amp; Jamshedpur Hub</span>
          </div>
        </div>
      </div>

      {/* ── ABOUT PANEL — fixed, slides over canvas from left ── */}
      {/* Inline style = highest specificity, applied before GSAP runs */}
      <div
        ref={aboutRef}
        className="about-panel"
        style={{ opacity: 0, transform: 'translate(35vw, 35vh) scale(0.15)', transformOrigin: 'right bottom', pointerEvents: 'none' }}
      >
        <div className="about-glass">
          {/* Left col */}
          <div className="about-left">
            <span className="about-label">What We Do</span>
            <h2 className="about-title">
              Building Software<br />That Works for You
            </h2>
            <p className="about-desc">
              Evangelion is a custom SaaS development agency. We engineer custom billing platforms, 
              fee management systems, and tailored ERP solutions that turn complex business workflows 
              into simple, automated digital dashboards.
            </p>
            <p className="about-desc">
              Based in Jamshedpur, we work directly with local businesses, gym franchises, coaching centers, 
              and academic institutions in Gamharia and Jamshedpur to scale their digital infrastructure.
            </p>
            <div className="about-cta-row">
              <a href="#contact" className="btn-primary">Build Your System</a>
              <a href="#projects" className="btn-ghost">See Portfolio ↗</a>
            </div>
          </div>

          {/* Right col — stats */}
          <div className="about-right">
            {[
              { value: '15+',  label: 'Systems Deployed' },
              { value: '99.9%', label: 'Uptime Maintained' },
              { value: '4x',   label: 'Operational Speedup' },
              { value: 'Gamharia', label: 'Primary Hub' },
            ].map((stat) => (
              <div key={stat.label} className="about-stat">
                <span className="about-stat-value">{stat.value}</span>
                <span className="about-stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TESTIMONIAL PANEL — fixed, pops up from center ── */}
      <div
        ref={testimonialRef}
        className="testimonial-panel"
        style={{ opacity: 0, pointerEvents: 'none' }}
      >
        <div className="testimonial-container">
          <h2 className="testimonial-section-title">What Our Clients Say</h2>
          <div className="testimonial-grid">
            {/* Card 1 */}
            <div className="testimonial-card" style={{ opacity: 0, transform: 'scale(0.7) translateY(40px)' }}>
              <div className="card-top">
                <div className="testimonial-quote-icon">
                  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 8c-3.3 0-6 2.7-6 6v10h10V14H6.2c.4-2.2 2.3-4 4.8-4V8zm14 0c-3.3 0-6 2.7-6 6v10h10V14h-7.8c.4-2.2 2.3-4 4.8-4V8z" fill="currentColor"/>
                  </svg>
                </div>
                <div className="testimonial-rating">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="star">✦</span>
                  ))}
                </div>
              </div>
              <p className="testimonial-card-text">
                “The billing management system Evangelion built completely automated our membership tracking. No more manual excel sheets — member payments and billing status are tracked in real-time.”
              </p>
              <div className="testimonial-card-footer">
                <div className="testimonial-avatar-wrap">
                  <img src={testimonialAvatar1} alt="Beard Biceps Gym" className="testimonial-avatar" />
                </div>
                <div className="testimonial-client-info">
                  <h4 className="testimonial-client-name">Beard Biceps Gym</h4>
                  <p className="testimonial-client-role">Billing Management • Gamharia</p>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="testimonial-card" style={{ opacity: 0, transform: 'scale(0.7) translateY(40px)' }}>
              <div className="card-top">
                <div className="testimonial-quote-icon">
                  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 8c-3.3 0-6 2.7-6 6v10h10V14H6.2c.4-2.2 2.3-4 4.8-4V8zm14 0c-3.3 0-6 2.7-6 6v10h10V14h-7.8c.4-2.2 2.3-4 4.8-4V8z" fill="currentColor"/>
                  </svg>
                </div>
                <div className="testimonial-rating">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="star">✦</span>
                  ))}
                </div>
              </div>
              <p className="testimonial-card-text">
                “Managing student fee schedules for hundreds of students used to take hours. The fees management system automated tracking, collection updates, and pending alerts smoothly.”
              </p>
              <div className="testimonial-card-footer">
                <div className="testimonial-avatar-wrap">
                  <img src={testimonialAvatar2} alt="Gita Classes" className="testimonial-avatar" />
                </div>
                <div className="testimonial-client-info">
                  <h4 className="testimonial-client-name">Gita Classes</h4>
                  <p className="testimonial-client-role">Fees Management • Gamharia</p>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="testimonial-card" style={{ opacity: 0, transform: 'scale(0.7) translateY(40px)' }}>
              <div className="card-top">
                <div className="testimonial-quote-icon">
                  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 8c-3.3 0-6 2.7-6 6v10h10V14H6.2c.4-2.2 2.3-4 4.8-4V8zm14 0c-3.3 0-6 2.7-6 6v10h10V14h-7.8c.4-2.2 2.3-4 4.8-4V8z" fill="currentColor"/>
                  </svg>
                </div>
                <div className="testimonial-rating">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="star">✦</span>
                  ))}
                </div>
              </div>
              <p className="testimonial-card-text">
                “Our custom ERP system coordinates student batches, fee billing, and schedule rosters under a single unified glass dashboard. It has drastically simplified our administration.”
              </p>
              <div className="testimonial-card-footer">
                <div className="testimonial-avatar-wrap">
                  <img src={testimonialAvatar3} alt="Sumit Classes" className="testimonial-avatar" />
                </div>
                <div className="testimonial-client-info">
                  <h4 className="testimonial-client-name">Sumit Classes</h4>
                  <p className="testimonial-client-role">ERP Solution • Gamharia</p>
                </div>
              </div>
            </div>
          </div>

          <div className="testimonial-logos">
            <span className="logo-label">BUILT WITH MODERN ENTERPRISE TECH</span>
            <div className="logo-row">
              <span className="logo-item">REACT</span>
              <span className="logo-item">NODE.JS</span>
              <span className="logo-item">NEXT.JS</span>
              <span className="logo-item">MONGODB</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── CLIENTS PANEL — fixed, zooms in ── */}
      <div
        ref={clientsRef}
        className="clients-panel"
        style={{ opacity: 0, transform: 'scale(1.3)', pointerEvents: 'none' }}
      >
        <div className="clients-glass">
          <div className="clients-header">
            <span className="clients-label">Deployments</span>
            <h2 className="clients-title">Our Client Portfolio</h2>
          </div>
          <div className="clients-grid">
            {[
              { name: 'BEARD BICEPS GYM', region: 'Billing Management • Gamharia' },
              { name: 'GITA CLASSES', region: 'Fees Management • Gamharia' },
              { name: 'SUMIT CLASSES', region: 'ERP Solution • Gamharia' },
              { name: 'PROVENANCE 2.0', region: 'Tech Fest Portal • RVSCET Jamshedpur' }
            ].map((client) => (
              <div key={client.name} className="client-card">
                <span className="client-logo">{client.name}</span>
                <span className="client-region">{client.region}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTACT FORM PANEL — fixed, slides horizontally ── */}
      <div
        ref={contactRef}
        className="contact-panel"
        style={{ opacity: 0, transform: 'translateX(-100vw)', pointerEvents: 'none' }}
      >
        <div className="contact-glass">
          {/* Left Column: Info & Details */}
          <div className="contact-left">
            <span className="contact-label">Connect</span>
            <h2 className="contact-title">Start Your<br />Project</h2>
            <p className="contact-desc">
              Request a custom software consultation for your business, gym, or educational center.
              Our systems engineers will design a tailored dashboard demonstration suited to your workflow.
            </p>
            <div className="contact-bullet-list">
              <div className="bullet-item">
                <span className="bullet-icon">✦</span>
                <span className="bullet-text">Fully customizable billing &amp; ERP structures</span>
              </div>
              <div className="bullet-item">
                <span className="bullet-icon">✦</span>
                <span className="bullet-text">Seamless migration from offline excel operations</span>
              </div>
              <div className="bullet-item">
                <span className="bullet-icon">✦</span>
                <span className="bullet-text">Dedicated local developer support &amp; hosting</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Form */}
          <div className="contact-right">
            <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="form-name">Name</label>
                  <input type="text" id="form-name" placeholder="John Doe" required className="form-input" />
                </div>
                <div className="form-group">
                  <label htmlFor="form-org">Organization / Business</label>
                  <input type="text" id="form-org" placeholder="Beard Biceps Gym" required className="form-input" />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="form-email">Email Address</label>
                  <input type="email" id="form-email" placeholder="contact@yourbusiness.com" required className="form-input" />
                </div>
                <div className="form-group">
                  <label htmlFor="form-interest">Platform Domain</label>
                  <select id="form-interest" className="form-select" defaultValue="">
                    <option value="" disabled>Select System</option>
                    <option value="billing">Gym Billing Management</option>
                    <option value="fees">Coaching Fees Management</option>
                    <option value="erp">Enterprise ERP Solution</option>
                    <option value="web">Custom Web &amp; App Portal</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="form-msg">Inquiry Details</label>
                <textarea id="form-msg" rows={3} placeholder="Describe your billing, ERP, or custom SaaS development requirements..." required className="form-textarea" />
              </div>

              <button type="submit" className="btn-submit">
                Submit Inquiry →
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ── CONTACT, CLIENTS & FOOTER OVERLAY PANEL — slides up from bottom ── */}

      {/* ── 600vh SPACER — scroll drives all fixed-layer animations ── */}
      <div
        ref={spacerRef}
        style={{ height: '600vh', position: 'relative', zIndex: 1 }}
      />
    </>
  )
}
