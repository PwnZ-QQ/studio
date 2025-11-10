import createMiddleware from 'next-intl/middleware';
 
export default createMiddleware({
  locales: ['cs', 'en'],
  defaultLocale: 'cs'
});
 
export const config = {
  matcher: ['/', '/(cs|en)/:path*']
};