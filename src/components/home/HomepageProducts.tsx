import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../product/ProductCard';
import { useHorizontalScroll } from '../../hooks/useHorizontalScroll';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const PRODUCTS_PER_PAGE = 4;

interface Category {
  category_id: number;
  name: string;
  slug: string;
  icon_url: string | null;
}

interface ProductMedia {
  media_id: number;
  product_id: number;
  type: string;
  url: string;
  sort_order: number;
  public_id: string | null;
}

interface Product {
  product_id: number;
  product_name: string;
  product_description: string;
  price: number;  // Use price from backend (already calculated with special price logic)
  originalPrice: number;  // Use originalPrice from backend
  selling_price?: number;  // Keep for backward compatibility
  cost_price?: number;  // Keep for backward compatibility
  image: string;
  stock: number;
  isNew?: boolean;
  featured?: boolean;
  favourite?: boolean;
  attributes: any[];
  brand_id: number;
  category_id: number;
  active_flag: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  discount_pct: number;
  merchant_id: number;
  sku: string;
  special_price: number | null;
  special_start: string | null;
  special_end: string | null;
  media: ProductMedia[];
}

interface CategoryWithProducts {
  category: Category;
  products: Product[];
  subcategories: {
    category: Category;
    products: Product[];
  }[];
}

interface CategoryState {
  activeCategory: string;
  currentPage: number;
}

const HomepageProducts: React.FC = () => {
  const [categoriesWithProducts, setCategoriesWithProducts] = useState<CategoryWithProducts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryStates, setCategoryStates] = useState<Record<number, CategoryState>>({});
  const [itemsPerView, setItemsPerView] = useState(4);
  const navigate = useNavigate();
  const hasFetched = useRef(false);
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

  useEffect(() => {
    const fetchHomepageProducts = async () => {
      if (hasFetched.current) return;
      hasFetched.current = true;

      try {
        const response = await fetch(`${API_BASE_URL}/api/homepage/products`, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch homepage products');
        }

        const data = await response.json();

        if (data.status === 'success') {
          setCategoriesWithProducts(data.data);
          const initialStates: Record<number, CategoryState> = {};
          data.data.forEach((category: CategoryWithProducts) => {
            initialStates[category.category.category_id] = {
              activeCategory: 'All',
              currentPage: 1
            };
          });
          setCategoryStates(initialStates);
        } else {
          setError('Failed to fetch products');
        }
      } catch (err) {
        setError('Error loading products');
      } finally {
        setLoading(false);
      }
    };

    fetchHomepageProducts();
  }, []);

  const renderProductCard = (product: Product) => {
    return (
      <ProductCard
        key={product.product_id}
        product={{
          id: product.product_id,
          name: product.product_name,
          price: product.price || product.selling_price || 0,  // Use backend-calculated price, fallback to selling_price
          original_price: product.originalPrice || product.cost_price || 0,  // Use backend-calculated originalPrice, fallback to cost_price
          special_price: product.special_price,
          image_url: product.media?.[0]?.url || product.image,
          images: product.media?.map(m => m.url) || [product.image],
          stock: product.stock,
          is_deleted: false,
          sku: product.sku,
          description: product.product_description,
          category: {
            category_id: product.category_id,
            name: 'General'
          },
          brand: {
            brand_id: product.brand_id,
            name: 'Brand'
          },
          special_start: product.special_start,
          special_end: product.special_end,
          discount_pct: product.discount_pct,
          rating: 0,
          reviews: 0,
          isNew: product.isNew,
          currency: 'INR',
          tags: [],
        }}
        isNew={product.isNew}
        salePercentage={product.discount_pct}
      />
    );
  };

  // Get all products for the active category
  const getActiveCategoryProducts = (categoryData: CategoryWithProducts) => {
    const categoryState = categoryStates[categoryData.category.category_id];
    const activeCategory = categoryState?.activeCategory || categoryData.category.name;

    if (activeCategory === 'All') {
      return categoryData.subcategories.flatMap(sub => sub.products || []);
    }

    const selectedSubcategory = categoryData.subcategories.find(
      sub => sub.category.name === activeCategory
    );

    if (selectedSubcategory) {
      return selectedSubcategory.products || [];
    }

    return [];
  };

  // Get visible products for a specific category
  const getVisibleProducts = (categoryData: CategoryWithProducts) => {
    const categoryState = categoryStates[categoryData.category.category_id];
    const currentPage = categoryState?.currentPage || 1;
    const allProducts = getActiveCategoryProducts(categoryData);
    const startIndex = (currentPage - 1) * itemsPerView;
    const endIndex = startIndex + itemsPerView;
    return allProducts.slice(startIndex, endIndex);
  };

  // Calculate total pages for a specific category
  const getTotalPages = (categoryData: CategoryWithProducts) => {
    const totalProducts = getActiveCategoryProducts(categoryData).length;
    return Math.ceil(totalProducts / itemsPerView);
  };

  // Handle category change for a specific section
  const handleCategoryChange = (categoryId: number, categoryName: string) => {
    setCategoryStates(prev => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        activeCategory: categoryName,
        currentPage: 1
      }
    }));
  };

  // Handle page navigation for a specific section
  const handlePrevPage = (categoryId: number) => {
    setCategoryStates(prev => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        currentPage: Math.max(prev[categoryId].currentPage - 1, 1)
      }
    }));
  };

  const handleNextPage = (categoryId: number) => {
    setCategoryStates(prev => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        currentPage: Math.min(prev[categoryId].currentPage + 1, getTotalPages(categoriesWithProducts.find(c => c.category.category_id === categoryId)!))
      }
    }));
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-12">
      {categoriesWithProducts.map((categoryData) => (
        <section key={categoryData.category.category_id} className="pb-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col space-y-6">
              {/* Header with navigation */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <h6 className="text-xl font-medium font-worksans">{categoryData.category.name}</h6>
                
                {/* Categories and Navigation */}
                <div className="flex items-center w-full md:w-auto overflow-x-auto pb-2 md:pb-0 space-x-6">
                  <button
                    className={`whitespace-nowrap ${
                      categoryStates[categoryData.category.category_id]?.activeCategory === 'All'
                        ? 'text-[#F2631F] border-b-2 border-[#F2631F]'
                        : 'text-gray-600 hover:text-[#F2631F]'
                    } pb-1`}
                    onClick={() => handleCategoryChange(categoryData.category.category_id, 'All')}
                  >
                    All
                  </button>
                  {categoryData.subcategories.map((subcategory) => (
                    <button
                      key={subcategory.category.category_id}
                      className={`whitespace-nowrap ${
                        categoryStates[categoryData.category.category_id]?.activeCategory === subcategory.category.name
                          ? 'text-[#F2631F] border-b-2 border-[#F2631F]'
                          : 'text-gray-600 hover:text-[#F2631F]'
                      } pb-1`}
                      onClick={() => handleCategoryChange(categoryData.category.category_id, subcategory.category.name)}
                    >
                      {subcategory.category.name}
                    </button>
                  ))}
                  <div className="flex items-center space-x-3">
                    <button 
                      className={
                        categoryStates[categoryData.category.category_id]?.currentPage === 1 
                          ? 'text-gray-400 cursor-not-allowed' 
                          : 'hover:text-black text-gray-500 transition-colors'
                      }
                      onClick={() => handlePrevPage(categoryData.category.category_id)}
                      disabled={categoryStates[categoryData.category.category_id]?.currentPage === 1}
                      aria-label="Previous products"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button 
                      className={
                        categoryStates[categoryData.category.category_id]?.currentPage === getTotalPages(categoryData)
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'hover:text-black text-gray-500 transition-colors'
                      }
                      onClick={() => handleNextPage(categoryData.category.category_id)}
                      disabled={categoryStates[categoryData.category.category_id]?.currentPage === getTotalPages(categoryData)}
                      aria-label="Next products"
                    >
                      <ChevronRight size={20} />
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
                  {getVisibleProducts(categoryData).map((product) => (
                    <div 
                      key={product.product_id} 
                      className="flex-none"
                      style={{ width: `calc(${100 / itemsPerView}% - ${(itemsPerView - 1) * 12 / itemsPerView}px)` }}
                    >
                      {renderProductCard(product)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
};

export default HomepageProducts; 