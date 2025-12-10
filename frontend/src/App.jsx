import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Layout from './components/layout/Layout'
import Landing from './pages/Landing/Landing'
import Shop from './pages/Shop/Shop'
import ShopBrand from './pages/Shop/ShopBrand'
import ProductDetail from './pages/Shop/ProductDetail'
import ProductDetailClothing from './pages/Shop/ProductDetailClothing'
import Events from './pages/Events/Events'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import Profile from './pages/Profile/Profile'
import Cart from './pages/Cart/Cart'
import MyCars from './pages/MyCars/MyCars'
import Forum from './pages/Forum/Forum'
import ForumCategory from './pages/Forum/ForumCategory'
import ForumTopic from './pages/Forum/ForumTopic'
import CreateTopic from './pages/Forum/CreateTopic'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { NotificationProvider } from './contexts/NotificationContext'

// Создаем клиент React Query для управления состоянием сервера
const queryClient = new QueryClient()

// Главный компонент - настраивает роутинг и все провайдеры
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <NotificationProvider>
            <BrowserRouter>
              <Layout>
              <Routes>
              {/* Лендинг-страница - главная страница сайта */}
              <Route path="/" element={<Landing />} />
              {/* Магазин атрибутики */}
              <Route path="/shop" element={<Shop />} />
              <Route path="/shop/:brandSlug" element={<ShopBrand />} />
              <Route path="/shop/product/:productId" element={<ProductDetail />} />
              <Route path="/shop/product/:productId/clothing" element={<ProductDetailClothing />} />
              {/* Мероприятия и сходки */}
              <Route path="/events" element={<Events />} />
              {/* Страницы аутентификации */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              {/* Страницы личного кабинета (требуют авторизации) */}
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:userId" element={<Profile />} />
              <Route path="/cart" element={<Cart />} />
              {/* Страницы форума */}
              <Route path="/forum" element={<Forum />} />
              <Route path="/forum/category/:slug" element={<ForumCategory />} />
              <Route path="/forum/category/:slug/create-topic" element={<CreateTopic />} />
              <Route path="/forum/topic/:id" element={<ForumTopic />} />
              </Routes>
            </Layout>
          </BrowserRouter>
          </NotificationProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App

