import Footer from "./footer"
import Header from "./header"

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex-grow p-5">
            {children}
        </div>
        <Footer />
    </div>
  )
}

export default Layout