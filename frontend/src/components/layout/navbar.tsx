'use client';

import { Menu, X, FileText, LogOut } from 'lucide-react';
import { Button } from '../ui/button';
import { ThemeToggle } from '../common/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useEffect, useRef, useState } from 'react';
import { User as UserType } from '../../types';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavbarProps {
  user?: UserType | null;
  onLogout?: () => void;
}

export function Navbar({ user, onLogout }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const desktopNavItems = [
    { label: 'Home', href: '/' },
    { label: 'Templates', href: '/templates' },
    ...(user ? [{ label: 'Dashboard', href: '/dashboard' }] : []),
  ];
  const mobileNavItems = [
    { label: 'Home', href: '/' },
    { label: 'Templates', href: '/templates' },
  ];

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !menuRef.current) return;
      const focusable = menuRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileMenuOpen]);

  return (
    <nav className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2 min-w-0">
            <FileText className="h-7 w-7 text-primary shrink-0" aria-hidden />
            <span className="font-semibold text-lg sm:text-xl truncate">
              SkillPaper
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {desktopNavItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`hover:text-primary transition-colors ${
                  pathname === item.href
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-2">
            <ThemeToggle />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-11 w-11 rounded-full"
                    aria-label="Account menu"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>
                        {user.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 z-[60]" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.name}</p>
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={onLogout}
                    className="cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/templates">Get Started</Link>
                </Button>
              </div>
            )}
          </div>

          <div className="flex md:hidden items-center gap-1">
            <ThemeToggle />
            {!user && (
              <Button variant="ghost" size="sm" asChild className="hidden xs:inline-flex sm:inline-flex">
                <Link href="/login">Sign In</Link>
              </Button>
            )}
            <Button
              ref={closeButtonRef}
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-foreground" />
              ) : (
                <Menu className="h-6 w-6 text-foreground" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 top-16 z-40 bg-background/80 backdrop-blur-sm md:hidden"
            aria-label="Close menu overlay"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            ref={menuRef}
            id="mobile-menu"
            className="absolute left-0 right-0 z-50 border-b border-border bg-background md:hidden shadow-lg"
          >
            <div className="px-4 py-3 space-y-1">
              {mobileNavItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`block min-h-11 px-3 py-3 rounded-md text-base font-medium hover:text-primary hover:bg-accent transition-colors ${
                    pathname === item.href
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-3 mt-2 border-t border-border space-y-2">
                {user ? (
                  <>
                    <div className="flex items-center px-3 py-2">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>
                          {user.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="ml-3 min-w-0">
                        <div className="text-base font-medium truncate">
                          {user.name}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <Link
                      href="/dashboard"
                      className={`block min-h-11 px-3 py-3 rounded-md text-base font-medium hover:text-primary hover:bg-accent transition-colors ${
                        pathname === '/dashboard'
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        onLogout?.();
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left min-h-11 px-3 py-3 rounded-md text-base font-medium text-muted-foreground hover:text-primary"
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 px-1 pb-2">
                    <Button variant="outline" asChild className="w-full">
                      <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                        Sign In
                      </Link>
                    </Button>
                    <Button asChild className="w-full">
                      <Link
                        href="/templates"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Get Started
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
