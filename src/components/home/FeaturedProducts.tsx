import React, { useState, useEffect,useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '../product/ProductCard';
import { useHorizontalScroll } from '../../hooks/useHorizontalScroll';

// Product type for featured products from API
export type FeaturedProduct = {
  product_id: number;
  product_name: string;
  selling_price: number;
  special_price: number | null;
  discount_pct: number;
  product_description: string;
  images: string[];
  // Backend-calculated pricing fields
  price: number;
  originalPrice: number | null;
  category: {
    category_id: number;
    name: string;
  };
  brand: {
    brand_id: number;
    name: string;
  };
  placement?: {
    placement_id: number;
    sort_order: number;
    added_at: string;
    expires_at: string | null;
  };
  stock?: {
    stock_qty: number;
  };
};

// Type for ProductCard props
type ProductCardProps = {
  id: number;
  name: string;
  price: number;
  rating: number;
  reviews: number;
  stock: number;
  description: string;
  image: string;
  images: string[];
  category: string;
  currency: string;
  tags: string[];
  originalPrice: number;
};

const FeaturedProducts: React.FC = () => {
  const [itemsPerView, setItemsPerView] = useState(4);
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    containerRef,
    isDragging,
    handleMouseDown,
    handleMouseUp,
    handleMouseMove,
    handleTouchStart,
    handleTouchMove,
    handleWheel,
    scroll
  } = useHorizontalScroll();

  // Fetch featured products
  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/featured-products/?per_page=12`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch featured products');
      }

      const data = await response.json();
      console.log('API Response:', data);

      if (data.message?.products && Array.isArray(data.message.products)) {
        console.log('Products array:', data.message.products);
        setProducts(data.message.products);
        setError(null);
      } else {
        console.error('Invalid data structure:', {
          hasMessage: Boolean(data.message),
          hasProducts: Boolean(data.message?.products),
          isProductsArray: Array.isArray(data.message?.products),
          dataType: typeof data.message?.products,
          dataKeys: Object.keys(data)
        });
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching featured products:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch featured products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  // Update items per view based on screen size
  useEffect(() => {
    const updateItemsPerView = () => {
      const width = window.innerWidth;
      if (width < 640) { // sm breakpoint
        setItemsPerView(1);
      } else if (width < 768) { // md breakpoint
        setItemsPerView(2);
      } else if (width < 1024) { // lg breakpoint
        setItemsPerView(3);
      } else if (width < 1280) { // xl breakpoint
        setItemsPerView(4);
      } else { // 2xl breakpoint
        setItemsPerView(5);
      }
    };

    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView);
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, []);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
  };
  
  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' });
  };
  
  if (loading) {
    return (
      <section className="pb-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="pb-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-red-500 mb-4">Error loading featured products: {error}</p>
            <button 
              onClick={fetchFeaturedProducts}
              className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            >
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="pb-12">
      {products && <div className="container mx-auto px-4">
        <div className="flex flex-col space-y-6">
          {/* Header with navigation */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <h6 className="text-xl font-medium font-worksans">Featured Products</h6>
            
            {/* Navigation */}
            <div className="flex items-center w-full md:w-auto space-x-4">
              <Link to="/featured-products" className="text-orange-500 text-sm font-medium mr-6">
                See All
              </Link>
              
              <div className="flex items-center space-x-3">
              <button
                onClick={() => scroll('left')}
                className="focus:outline-none"
                aria-label="Scroll Left"
              >
                <ChevronLeft size={20} className="text-gray-500 hover:text-black duration-300" />
              </button>
              <button
                onClick={() => scroll('right')}
                className="focus:outline-none"
                aria-label="Scroll Right"
              >
                <ChevronRight size={20} className="text-gray-500 hover:text-black duration-300" />
              </button>
            </div>
            </div>
          </div>

          {/* Products carousel */}
          <div className="relative">
            <div
              ref={containerRef}
              className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide"
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onMouseMove={handleMouseMove}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onWheel={handleWheel}
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
              {products.map((product) => (
                <div 
                  key={product.product_id} 
                  className="flex-none"
                  style={{ width: `calc(${100 / itemsPerView}% - ${(itemsPerView - 1) * 12 / itemsPerView}px)` }}
                >
                  <ProductCard 
                    product={{
                      id: product.product_id,
                      name: product.product_name,
                      price: product.price, // Use backend-calculated price
                      rating: 0,
                      reviews: 0,
                      stock: product.stock?.stock_qty || 0,
                      description: product.product_description,
                      images: product.images || [],
                      category: product.category?.name || '',
                      currency: 'INR',
                      tags: [],
                      original_price: product.originalPrice || 0, // Use backend-calculated originalPrice
                      sku: '',
                      primary_image: product.images?.[0] || ''
                    }}
                    salePercentage={product.discount_pct || undefined}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>}
    </section>
  );
};

export default FeaturedProducts;