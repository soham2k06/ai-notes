import Nav from "./Nav";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main className="p-4 max-w-7xl mx-auto">{children}</main>
    </>
  );
}

export default Layout;
