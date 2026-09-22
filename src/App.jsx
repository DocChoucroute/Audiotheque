import { Route, BrowserRouter, Routes } from 'react-router-dom'
import Header from './components/Header'
import BookDetail from './pages/BookDetail'
import Home from './pages/Home'
import AdminBookChapters from './pages/admin/AdminBookChapters'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminLayout from './pages/admin/AdminLayout'

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/livres/:bookId" element={<BookDetail />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="livres/:bookId" element={<AdminBookChapters />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
