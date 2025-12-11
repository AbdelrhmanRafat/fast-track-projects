'use client'

import { usePathname } from 'next/navigation'

/**
 * Hook to determine category type based on current route
 * @returns category type string (news, images, videos, calendar)
 */
export function useCategoryType(): string {
	const pathname = usePathname()

	// Map routes to category types
	if (pathname.includes('/news/categories')) {
		return 'news'
	}
	if (pathname.includes('/gallery/categories') || pathname.includes('/photos/categories') || pathname.includes('/images/categories')) {
		return 'images'
	}
	if (pathname.includes('/videos/categories')) {
		return 'videos'
	}
	if (pathname.includes('/calendar/categories')) {
		return 'calendar'
	}

	// Default fallback
	return 'news'
}



