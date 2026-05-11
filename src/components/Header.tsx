'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion'
import { HiArrowRight, HiXMark, HiBars3BottomRight } from 'react-icons/hi2'
import { FaWhatsapp } from 'react-icons/fa'
import { getAuthSessionHref, getLocalClientPortalPath, getLocalDashboardPath, getLocalTeamLoginPath } from '@/lib/access-links'

// --- DATOS DE NAVEGACIÓN ---
const links = [
  { href: '/servicios', label: 'Servicios' },
  { href: '/demos', label: 'Laboratorio' }, 
  { href: '/portafolio', label: 'Portafolio' },
  { href: '/sobre-nosotros', label: 'Nosotros' },
  { href: '/contacto', label: 'Contacto' } 
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [sessionState, setSessionState] = useState<HeaderSession | null | undefined>(undefined)
  const pathname = usePathname()
  const { scrollY } = useScroll()

  // Detectar scroll para cambiar el estilo de la barra
  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 50) {
      setIsScrolled(true)
    } else {
      setIsScrolled(false)
    }
  })

  // Bloquear scroll body al abrir menú móvil
  useEffect(() => {
    if (mobileMenuOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = 'unset'
  }, [mobileMenuOpen])

  useEffect(() => {
    let isMounted = true

    fetch(getAuthSessionHref(), {
      credentials: 'include',
      cache: 'no-store',
    })
      .then(async (response) => {
        if (!response.ok) {
          return null
        }

        const data = (await response.json()) as { session?: HeaderSession | null }
        return data.session ?? null
      })
      .then((session) => {
        if (isMounted) {
          setSessionState(session)
        }
      })
      .catch(() => {
        if (isMounted) {
          setSessionState(null)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const primaryAccess = getPrimaryAccess(sessionState)

  return (
    <>
      {/* --- HEADER FLOTANTE (DESKTOP) --- */}
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'py-4' : 'py-6'
        }`}
      >
        <div className="mx-auto max-w-[1400px] px-6">
          <nav 
            className={`flex items-center justify-between rounded-full px-6 transition-all duration-300 ${
              isScrolled 
                ? 'bg-neutral-900/80 backdrop-blur-xl border border-white/10 shadow-2xl py-3' 
                : 'bg-transparent border border-transparent py-2'
            }`}
          >
            
            {/* LOGO */}
            <div className="flex lg:flex-1">
              <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-3 group" aria-label="Inicio">
                <div className="relative w-8 h-8 overflow-hidden rounded-lg">
                    <Image
                        src="/images/logo.png" 
                        alt="Vertrex"
                        width={32}
                        height={32}
                        className="object-cover group-hover:scale-110 transition-transform"
                    />
                </div>
                <span className="font-display text-xl font-bold tracking-widest text-white group-hover:text-primary transition-colors">
                  VERTREX
                </span>
              </Link>
            </div>

            {/* NAV LINKS (DESKTOP) */}
            <div className="hidden lg:flex lg:gap-x-1">
              {links.map((link) => {
                const isActive = pathname === link.href;
                return (
                    <Link 
                        key={link.href} 
                        href={link.href} 
                        className={`relative px-5 py-2 text-sm font-medium transition-colors rounded-full hover:text-white group overflow-hidden ${
                            isActive ? 'text-white' : 'text-neutral-400'
                        }`}
                    >
                        <span className="relative z-10">{link.label}</span>
                        {/* Fondo activo/hover animado */}
                        {isActive && (
                            <motion.div layoutId="navbar-indicator" className="absolute inset-0 bg-white/10 rounded-full z-0" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                        )}
                        <div className="absolute inset-0 bg-white/5 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 z-0 opacity-0 group-hover:opacity-100"></div>
                    </Link>
                )
              })}
            </div>

            {/* CTA BUTTON (DESKTOP) */}
            <div className="hidden lg:flex lg:flex-1 lg:justify-end gap-3">
              {/* Único botón de acceso pulido e integrado */}
              <Link 
                href={primaryAccess.href}
                className="rounded-full border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-bold text-white transition-all duration-300 hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
              >
                Acceder
              </Link>
              
              <Link 
                href="/contacto" 
                className={`rounded-full px-6 py-2.5 text-sm font-bold text-black shadow-lg hover:shadow-primary/25 hover:scale-105 transition-all duration-300 ${isScrolled ? 'bg-white' : 'bg-primary'}`}
              >
                Iniciar Proyecto
              </Link>
            </div>

            {/* HAMBURGER BUTTON (MOBILE) */}
            <div className="flex lg:hidden">
              <button
                type="button"
                className={`-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-white hover:text-primary transition-colors`}
                onClick={() => setMobileMenuOpen(true)}
              >
                <HiBars3BottomRight className="h-7 w-7" />
              </button>
            </div>
          </nav>
        </div>
      </motion.header>

      {/* --- MENÚ MÓVIL FULLSCREEN --- */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden bg-black/60 backdrop-blur-sm"
          >
            {/* Panel Lateral */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-neutral-950 px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-white/10 border-l border-white/10 shadow-2xl"
            >
              
              {/* Header del Menú */}
              <div className="flex items-center justify-between mb-12">
                <Link href="/" onClick={() => setMobileMenuOpen(false)} className="-m-1.5 p-1.5 flex items-center gap-3">
                    <Image src="/images/logo.png" alt="Vertrex" width={28} height={28} />
                    <span className="font-display text-lg font-bold tracking-widest text-white">VERTREX</span>
                </Link>
                <button
                  type="button"
                  className="-m-2.5 rounded-full p-2.5 text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <HiXMark className="h-6 w-6" />
                </button>
              </div>

              {/* Links de Navegación */}
              <div className="mt-6 flow-root">
                <div className="-my-6 divide-y divide-white/5">
                  <div className="space-y-4 py-6">
                    {links.map((link, idx) => (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + (idx * 0.05) }}
                      >
                        <Link
                            href={link.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className="group flex items-center justify-between -mx-3 rounded-xl px-3 py-4 text-xl font-bold leading-7 text-white hover:bg-white/5 transition-all"
                        >
                            {link.label}
                            <HiArrowRight className="text-white/20 group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transform duration-300" />
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* CTA Móvil */}
                  <div className="py-8 space-y-4">
                    {/* Botón único de Acceso en móvil */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                    >
                        <Link
                            href={primaryAccess.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center justify-center w-full gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-4 text-base font-bold text-white hover:border-primary/50 hover:bg-primary/10 hover:text-primary transition-all"
                        >
                            Acceder
                        </Link>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.40 }}
                    >
                        <Link
                            href="/contacto"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center justify-center w-full gap-2 rounded-xl bg-primary px-3 py-4 text-base font-bold text-black hover:bg-primary/90 transition-all shadow-[0_0_20px_theme(colors.primary.DEFAULT)]"
                        >
                            Cotizar Proyecto
                        </Link>
                    </motion.div>
                    
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                    >
                        <Link
                            href="https://wa.me/573000000000"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center justify-center w-full gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-4 text-base font-bold text-white hover:bg-white/10 transition-all"
                        >
                            <FaWhatsapp size={20} className="text-green-500"/> WhatsApp Directo
                        </Link>
                    </motion.div>
                  </div>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

type HeaderSession = {
  user: {
    role: 'team' | 'client'
    clientSlug: string | null
  }
}

// Mantuvimos tu lógica intacta para rutear dinámicamente según el estado de la sesión
function getPrimaryAccess(session: HeaderSession | null | undefined) {
  if (session?.user.role === 'team') {
    return { href: getLocalDashboardPath() }
  }

  if (session?.user.role === 'client') {
    return { href: getLocalClientPortalPath() }
  }

  return { href: getLocalTeamLoginPath() }
}