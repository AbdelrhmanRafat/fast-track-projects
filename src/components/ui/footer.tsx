export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
              <footer className='print:hidden' dir='ltr'>
            <div className='border-t border-accent-foreground-muted py-4 flex flex-col gap-3 justify-center items-center'>
            <p>© {new Date().getFullYear()} Family App. All Rights Reserved.</p>
            <p>Developed with ❤️ by <a href="https://www.el-abda3.com" target='_blank' className='hover:underline font-bold transition-all'>Digital Creativity Co.</a></p>
          </div>
          </footer>

  );
}