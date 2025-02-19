"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { LucideIcon } from "lucide-react"
import { cn } from "../../lib/utils"

interface NavItem {
  name: string
  url: string
  icon: LucideIcon
}

interface NavBarProps {
  items: NavItem[]
  className?: string
}

export function NavBar({ items, className }: NavBarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(
    items.find(item => item.url === location.pathname)?.name || items[0].name
  )
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Update active tab when location changes
  useEffect(() => {
    const currentItem = items.find(item => item.url === location.pathname);
    if (currentItem) {
      setActiveTab(currentItem.name);
    }
  }, [location.pathname, items]);

  const handleNavigation = (url: string) => {
    navigate(url, { state: { from: location.pathname } });
  };

  return (
    <div
      className={cn(
        "fixed md:bottom-0 bottom-auto top-0 left-1/2 -translate-x-1/2 z-50 md:mb-6 mt-6 md:mt-0 md:pt-6 pointer-events-none",
        className
      )}
    >
      <div className="flex items-center gap-4 bg-[#FFFFFF]/10 border border-[#363332]/10 backdrop-blur-md py-2 px-2 rounded-full shadow-lg pointer-events-auto">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.name

          return (
            <button
              key={item.name}
              data-path={item.url}
              onClick={() => {
                setActiveTab(item.name)
                handleNavigation(item.url)
              }}
              className={cn(
                "relative cursor-pointer text-sm font-lora font-medium px-6 py-2.5 rounded-full transition-all duration-300",
                "text-[#363332]/60 hover:text-[#363332]",
                isActive && "bg-white/30 text-[#363332]",
              )}
            >
              <span className="hidden md:inline uppercase tracking-wide text-xs">
                {item.name}
              </span>
              <span className="md:hidden">
                <Icon size={18} strokeWidth={2} />
              </span>
              {isActive && (
                <motion.div
                  layoutId="lamp"
                  className="absolute inset-0 w-full bg-white/20 rounded-full -z-10"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#363332]/80 rounded-t-full">
                    <div className="absolute w-12 h-6 bg-[#363332]/10 rounded-full blur-md -top-2 -left-2" />
                    <div className="absolute w-8 h-6 bg-[#363332]/10 rounded-full blur-md -top-1" />
                    <div className="absolute w-4 h-4 bg-[#363332]/10 rounded-full blur-sm top-0 left-2" />
                  </div>
                </motion.div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
} 