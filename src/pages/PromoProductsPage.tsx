import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, ChevronDown, ChevronUp, SlidersHorizontal, ArrowUpDown, X, Check, Star } from 'lucide-react';
import { Product } from '../types';
import ProductCard from '../components/product/ProductCard';
import { toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Category {
  category_id: number;
  name: string;
  slug: string;
  icon_url: string;
  parent_id: number | null;
  children?: Category[];
}

const PromoProductsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [selectedRatings, setSelectedRatings] = useState<string[]>([]);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [perPage] = useState(16);

  // Add new state for expanded categories
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Mobile filter states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isMobileSortOpen, setIsMobileSortOpen] = useState(false);
  const [isDesktopSortOpen, setIsDesktopSortOpen] = useState(false);
  const [selectedSort, setSelectedSort] = useState('newest');
  const mobileSortRef = useRef<HTMLDivElement>(null);
  const desktopSortRef = useRef<HTMLDivElement>(null);
  const mobileFilterRef = useRef<HTMLDivElement>(null);

  // Sort options
  const sortOptions = [
    { label: 'Newest First', value: 'newest', sort_by: 'created_at', order: 'desc' },
    { label: 'Oldest First', value: 'oldest', sort_by: 'created_at', order: 'asc' },
    { label: 'Price: High to Low', value: 'price-desc', sort_by: 'selling_price', order: 'desc' },
    { label: 'Price: Low to High', value: 'price-asc', sort_by: 'selling_price', order: 'asc' }
  ];

  // Handle product click
  const handleProductClick = async (productId: string) => {
    navigate(`/product/${productId}`);
  };

  // Update selected category when URL changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryId = params.get('category');
    const brandId = params.get('brand');
    const search = params.get('search');
    const minPrice = params.get('min_price');
    const maxPrice = params.get('max_price');

    // Update category
    if (categoryId) {
      setSelectedCategory(categoryId);
      const category = categories.find(cat => cat.category_id === Number(categoryId));
      if (category?.parent_id !== null && category?.parent_id !== undefined) {
        setExpandedCategories(prev => ({
          ...prev,
          [String(category.parent_id)]: true
        }));
      }
    } else {
      setSelectedCategory('');
    }

    // Update brand
    if (brandId) {
      setSelectedBrands([brandId]);
    } else {
      setSelectedBrands([]);
    }

    // Update search
    if (search) {
      setSearchQuery(search);
    } else {
      setSearchQuery('');
    }

    // Update price range
    if (minPrice || maxPrice) {
      setPriceRange([
        minPrice ? Number(minPrice) : 0,
        maxPrice ? Number(maxPrice) : 1000000
      ]);
    } else {
      setPriceRange([0, 1000000]);
    }
  }, [location.search, categories]);

  // Toggle category expansion
  const toggleCategoryExpand = (categoryId: number) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Render category tree recursively
  const renderCategoryTree = (category: Category, level: number = 0) => {
    const isExpanded = expandedCategories[category.category_id] || false;
    const hasSubcategories = category.children && category.children.length > 0;
    const isSelected = selectedCategory === String(category.category_id);

    let btnClass = 'w-full flex items-center justify-between py-2 px-2 transition-colors border-none text-left font-normal';
    let spanClass = 'text-sm font-normal';
    if (level === 0) {
      btnClass += ' bg-transparent text-black hover:bg-orange-50 rounded-none';
    } else if (hasSubcategories) {
      if (isSelected) {
        btnClass += ' bg-white border border-[#F2631F] text-black rounded-md shadow-sm';
      } else {
        btnClass += ' bg-transparent text-black hover:bg-orange-50 rounded-md';
      }
    } else {
      if (isSelected) {
        btnClass += ' bg-[#F2631F] text-white rounded-md shadow';
      } else {
        btnClass += ' bg-transparent text-black hover:bg-orange-50 rounded-md';
      }
    }

    return (
      <div key={category.category_id}>
        <button
          onClick={() => {
            if (hasSubcategories) {
              toggleCategoryExpand(category.category_id);
            } else {
              setSelectedCategory(String(category.category_id));
              const params = new URLSearchParams(location.search);
              params.set('category', String(category.category_id));
              navigate(`?${params.toString()}`);
            }
          }}
          className={btnClass}
          style={{ paddingLeft: `${level * 1.25}rem` }}
        >
          <span className={spanClass}>{category.name}</span>
          {hasSubcategories && (
            <span className="flex items-center ml-auto">
              {isExpanded ? (
                <ChevronUp size={16} className="text-[#F2631F]" />
              ) : (
                <ChevronDown size={16} className="text-[#F2631F]" />
              )}
            </span>
          )}
        </button>
        {isExpanded && category.children && (
          <div className="ml-0">
            {category.children.map(subcategory => renderCategoryTree(subcategory, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Fetch promo products with filters
  const fetchPromoProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: perPage.toString(),
        sort_by: 'created_at',
        order: 'desc'
      });

      // Get URL parameters
      const urlParams = new URLSearchParams(location.search);
      const categoryId = urlParams.get('category');
      const brandId = urlParams.get('brand');

      // Add filters if they exist
      if (categoryId) {
        params.append('category_id', categoryId);
      }
      if (brandId) {
        params.append('brand_id', brandId);
        setSelectedBrands([brandId]);
      } else if (selectedBrands.length > 0) {
        params.append('brand_id', selectedBrands[0]);
      }
      if (priceRange[0] > 0) {
        params.append('min_price', priceRange[0].toString());
      }
      if (priceRange[1] < 1000000) {
        params.append('max_price', priceRange[1].toString());
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      console.log('Fetching promo products with params:', params.toString());

      const response = await fetch(`${API_BASE_URL}/api/promo-products/?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch promo products: ${response.status}`);
      }

      const data = await response.json();
      console.log('Promo products response:', data);

      // Transform the API response to match the Product type
      const transformedProducts = data.message.products.map((product: any) => ({
        id: String(product.product_id),
        name: product.product_name,
        description: product.product_description,
        price: product.price, // Use the backend-calculated price
        original_price: product.originalPrice, // Use the backend-calculated originalPrice
        currency: 'INR',
        image: product.images?.[0] || '',
        images: product.images || [],
        category: product.category?.name || '',
        featured: true,
        isNew: false,
        isBuiltIn: false,
        rating: 0,
        reviews: 0,
        stock: product.stock?.stock_qty || 0,
        tags: [],
        primary_image: product.images?.[0] || '',
        brand: product.brand?.name || '',
        sku: product.sku || '',
        category_id: product.category?.category_id,
        brand_id: product.brand?.brand_id
      }));
      setProducts(transformedProducts);
      setTotalPages(data.message.pagination.pages);
      setTotalProducts(data.message.pagination.total);

      if (categoryId && !selectedCategory) {
        setSelectedCategory(categoryId);
      }
    } catch (err) {
      console.error('Error fetching promo products:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch promo products');
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories/all`);
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  // Fetch brands
  const fetchBrands = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/brands/`);
      if (!response.ok) {
        throw new Error('Failed to fetch brands');
      }
      const data = await response.json();
      setBrands(data);
    } catch (err) {
      console.error('Error fetching brands:', err);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchPromoProducts();
    fetchCategories();
    fetchBrands();
  }, []);

  // Refetch products when filters or pagination changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPromoProducts();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [location.search, currentPage]);

  // Toggle brand selection
  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => {
      const newBrands = prev.includes(brand) ? [] : [brand];
      const params = new URLSearchParams(location.search);
      if (newBrands.length > 0) {
        params.set('brand', newBrands[0]);
      } else {
        params.delete('brand');
      }
      navigate(`?${params.toString()}`);
      return newBrands;
    });
  };

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    
    if (selectedCategory) {
      params.set('category', selectedCategory);
    } else {
      params.delete('category');
    }

    if (selectedBrands.length > 0) {
      params.set('brand', selectedBrands[0]);
    } else {
      params.delete('brand');
    }

    if (searchQuery) {
      params.set('search', searchQuery);
    } else {
      params.delete('search');
    }

    if (priceRange[0] > 0) {
      params.set('min_price', priceRange[0].toString());
    } else {
      params.delete('min_price');
    }

    if (priceRange[1] < 1000000) {
      params.set('max_price', priceRange[1].toString());
    } else {
      params.delete('max_price');
    }

    // Only update URL if there are actual changes
    const newUrl = `?${params.toString()}`;
    if (newUrl !== `?${location.search}`) {
      navigate(newUrl);
    }
  }, [selectedCategory, selectedBrands, searchQuery, priceRange]);

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedBrands([]);
    setPriceRange([0, 1000000]);
    setCurrentPage(1);
    
    const params = new URLSearchParams(location.search);
    params.delete('category');
    params.delete('brand');
    params.delete('search');
    navigate(`?${params.toString()}`);
  };

  // Sort products based on selected sort option (client-side)
  const sortProducts = (productsToSort: Product[], sortValue: string) => {
    const sortedProducts = [...productsToSort];
    switch (sortValue) {
      case 'newest':
        return sortedProducts.sort((a, b) => 
          new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
        );
      case 'oldest':
        return sortedProducts.sort((a, b) => 
          new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime()
        );
      case 'price-desc':
        return sortedProducts.sort((a, b) => b.price - a.price);
      case 'price-asc':
        return sortedProducts.sort((a, b) => a.price - b.price);
      default:
        return sortedProducts;
    }
  };

  // Handle sort change
  const handleSort = (value: string) => {
    setSelectedSort(value);
    setIsMobileSortOpen(false);
    setIsDesktopSortOpen(false);
    setProducts(prevProducts => sortProducts(prevProducts, value));
  };

  // When products are fetched or selectedSort changes, sort them
  useEffect(() => {
    setProducts(prevProducts => sortProducts(prevProducts, selectedSort));
  }, [selectedSort]);

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-center">
          <p className="text-xl font-semibold mb-2">Error Loading Promo Products</p>
          <p>{error}</p>
          <button 
            onClick={() => fetchPromoProducts()}
            className="mt-4 px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-4">
        {/* Breadcrumb */}
        <div className="text-xs text-gray-500 mb-4">
          <Link to="/">Home</Link> / <span>Promo Products</span>
        </div>
        
        {/* Mobile Filter and Sort Bar */}
        <div className="lg:hidden flex items-center gap-2 mb-4 sticky top-0 bg-white z-10 py-2">
          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg"
          >
            <SlidersHorizontal size={20} />
            <span>Filters</span>
          </button>
          <button
            onClick={() => setIsMobileSortOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg"
          >
            <ArrowUpDown size={20} />
            <span>Sort</span>
          </button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Category Sidebar */}
          <aside className="hidden lg:block w-72 pr-6 border-r border-gray-100">
            <div className="mb-8">
              <h3 className="font-semibold text-base mb-4 text-black">Category</h3>
              <div className="space-y-1">
                {categories.map(category => renderCategoryTree(category))}
              </div>
            </div>
            
            {/* Brand Filter */}
            <div className="mb-8">
              <h3 className="font-semibold text-base mb-4 text-black">Brand</h3>
              <div className="flex flex-wrap gap-2">
                {brands && brands.map((brand) => {
                  const isSelected = selectedBrands.includes(String(brand.brand_id || brand.id));
                  return (
                    <button
                      key={brand.brand_id || brand.id}
                      onClick={() => toggleBrand(String(brand.brand_id || brand.id))}
                      className={`px-3 py-1.5 rounded-full border text-xs font-normal transition-colors focus:outline-none ${
                        isSelected
                          ? 'bg-[#F2631F] text-white border-[#F2631F] shadow'
                          : 'bg-gray-100 border-gray-200 text-black hover:border-[#F2631F] hover:text-[#F2631F]'
                      }`}
                    >
                      {brand.name || brand.brand_name}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Price Range */}
            <div className="mb-8">
              <h3 className="font-semibold text-base mb-4 text-black">Price</h3>
              <div className="px-2">
                {/* Manual Input Fields */}
                <div className="flex gap-2 mb-3">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">Min Price</label>
                    <input
                      type="number"
                      min="0"
                      max={priceRange[1]}
                      value={priceRange[0]}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setPriceRange([value, Math.max(value, priceRange[1])]);
                      }}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#F2631F]"
                      placeholder="0"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">Max Price</label>
                    <input
                      type="number"
                      min={priceRange[0]}
                      max="1000000"
                      value={priceRange[1]}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1000000;
                        setPriceRange([priceRange[0], Math.max(priceRange[0], value)]);
                      }}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#F2631F]"
                      placeholder="1000000"
                    />
                  </div>
                </div>
                {/* Slider */}
                <div className="flex justify-between text-xs text-gray-700 mb-2 font-normal">
                  <span>₹{priceRange[0].toLocaleString()}</span>
                  <span>₹{priceRange[1].toLocaleString()}</span>
                </div>
                <div className="relative pt-1">
                  <div className="w-full h-1 bg-gray-200 rounded-lg">
                    <div
                      className="absolute h-1 bg-[#F2631F] rounded-lg"
                      style={{ width: `${(priceRange[1] / 1000000) * 100}%` }}
                    ></div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1000000"
                    step="10000"
                    value={priceRange[1]}
                    onChange={(e) => {setPriceRange([priceRange[0], parseInt(e.target.value)])}}
                    className="absolute top-0 w-full h-2 opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Ratings Filter */}
            <div className="mb-8">
              <h3 className="font-semibold text-base mb-4 text-black">Ratings</h3>
              {(() => {
                const selectedRatingValue = selectedRatings && selectedRatings.length > 0 ? parseFloat(selectedRatings[0]) : 0;
                return (
                  <div className="flex items-center">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(star => {
                        const isFull = selectedRatingValue >= star;
                        const isHalf = selectedRatingValue >= star - 0.5 && selectedRatingValue < star;
                        return (
                          <div key={star} className="relative cursor-pointer" style={{ width: 28, height: 28 }} onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const clickX = e.clientX - rect.left;
                            const rating = clickX < rect.width / 2 ? star - 0.5 : star;
                            setSelectedRatings([rating.toString()]);
                          }}>
                            <Star className="text-gray-300" fill="currentColor" size={28}/>
                            {isFull ? (
                              <div className="absolute top-0 left-0">
                                <Star className="text-yellow-400" fill="currentColor" size={28}/>
                              </div>
                            ) : isHalf ? (
                              <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
                                <Star className="text-yellow-400" fill="currentColor" size={28}/>
                              </div>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                    {selectedRatingValue > 0 && (
                      <span className="ml-2 text-sm font-medium text-gray-700">{selectedRatingValue}★ & up</span>
                    )}
                  </div>
                )
              })()}
            </div>

            {/* Reset Filters Button */}
            <button
              onClick={resetFilters}
              className="w-full px-4 py-2 text-sm font-normal text-[#F2631F] border border-[#F2631F] rounded hover:bg-orange-50 transition-colors"
            >
              Reset Filters
            </button>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search Bar */}
            <div className="mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search promo products..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Desktop Sort Dropdown */}
            <div className="hidden lg:flex justify-end mb-6">
              <div className="relative" ref={desktopSortRef}>
                <button
                  className="flex items-center gap-2 px-4 py-2 border rounded-lg bg-white hover:border-[#F2631F] transition-colors"
                  onClick={() => setIsDesktopSortOpen(!isDesktopSortOpen)}
                >
                  <span>Sort By: </span>
                  <span className="text-[#F2631F]">
                    {sortOptions.find(opt => opt.value === selectedSort)?.label}
                  </span>
                  <ChevronDown size={16} />
                </button>
                {isDesktopSortOpen && (
                  <div className="absolute z-20 w-48 bg-white border rounded-lg shadow-lg top-full mt-1">
                    {sortOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => handleSort(option.value)}
                        className={`flex items-center w-full px-4 py-2 text-left hover:bg-gray-50 ${
                          selectedSort === option.value ? 'bg-orange-50 text-[#F2631F]' : ''
                        }`}
                      >
                        {selectedSort === option.value && <Check size={16} className="mr-2 text-[#F2631F]" />}
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {!loading && products.length === 0 ? (
              <div className="flex justify-center items-center py-16">
                <p className="text-gray-500">No products found matching your criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
                {products.map((product) => (
                  <div 
                    key={product.id}
                    onClick={() => handleProductClick(String(product.id))}
                    className="cursor-pointer transform transition-transform hover:scale-[1.02]"
                  >
                    <ProductCard 
                      product={product}
                      isNew={false}
                      isBuiltIn={false}
                    />
                  </div>
                ))}
              </div>
            )}
            
            {/* Pagination */}
            {totalPages > 0 && (
              <div className="flex justify-end items-center gap-1 my-6">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg disabled:opacity-50 p-2"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                {/* Page numbers with ... */}
                {(() => {
                  const pages = [];
                  let start = Math.max(1, currentPage - 2);
                  let end = Math.min(totalPages, currentPage + 2);

                  if (currentPage <= 3) {
                    end = Math.min(5, totalPages);
                  }
                  if (currentPage >= totalPages - 2) {
                    start = Math.max(1, totalPages - 4);
                  }

                  if (start > 1) {
                    pages.push(
                      <button
                        key={1}
                        onClick={() => setCurrentPage(1)}
                        className={`w-10 h-10 flex items-center justify-center border rounded-lg ${currentPage === 1 ? 'bg-primary-500 text-white border-primary-500' : 'border-gray-300'}`}
                      >
                        1
                      </button>
                    );
                    if (start > 2) {
                      pages.push(<span key="start-ellipsis" className="px-1">...</span>);
                    }
                  }

                  for (let i = start; i <= end; i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i)}
                        className={`py-2 px-1 w-10 h-10 flex items-center justify-center border rounded-lg ${currentPage === i ? 'bg-primary-500 text-white border-primary-500' : 'border-gray-300'}`}
                      >
                        {i}
                      </button>
                    );
                  }

                  if (end < totalPages) {
                    if (end < totalPages - 1) {
                      pages.push(<span key="end-ellipsis" className="px-1">...</span>);
                    }
                    pages.push(
                      <button
                        key={totalPages}
                        onClick={() => setCurrentPage(totalPages)}
                        className={`py-2 px-1 w-10 h-10 flex items-center justify-center border rounded-lg ${currentPage === totalPages ? 'bg-primary-500 text-white border-primary-500' : 'border-gray-300'}`}
                      >
                        {totalPages}
                      </button>
                    );
                  }

                  return pages;
                })()}
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg disabled:opacity-50 p-2"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {isFilterOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden">
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b mt-6 sm:mt-10 nav:mt-20">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Filters</h3>
                <button onClick={() => setIsFilterOpen(false)} className="p-2">
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {/* Category Filter */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">Category</h4>
                <div className="space-y-1">
                  {categories.map(category => renderCategoryTree(category))}
                </div>
              </div>

              {/* Brand Filter */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">Brand</h4>
                <div className="flex flex-wrap gap-2">
                  {brands && brands.map((brand) => {
                    const isSelected = selectedBrands.includes(String(brand.brand_id || brand.id));
                    return (
                      <button
                        key={brand.brand_id || brand.id}
                        onClick={() => toggleBrand(String(brand.brand_id || brand.id))}
                        className={`px-3 py-1.5 rounded-full border text-xs font-normal transition-colors focus:outline-none ${
                          isSelected
                            ? 'bg-[#F2631F] text-white border-[#F2631F] shadow'
                            : 'bg-gray-100 border-gray-200 text-black hover:border-[#F2631F] hover:text-[#F2631F]'
                        }`}
                      >
                        {brand.name || brand.brand_name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">Price</h4>
                <div className="px-2">
                  {/* Manual Input Fields */}
                  <div className="flex gap-2 mb-3">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">Min Price</label>
                      <input
                        type="number"
                        min="0"
                        max={priceRange[1]}
                        value={priceRange[0]}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          setPriceRange([value, Math.max(value, priceRange[1])]);
                        }}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#F2631F]"
                        placeholder="0"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">Max Price</label>
                      <input
                        type="number"
                        min={priceRange[0]}
                        max="1000000"
                        value={priceRange[1]}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 1000000;
                          setPriceRange([priceRange[0], Math.max(priceRange[0], value)]);
                        }}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#F2631F]"
                        placeholder="1000000"
                      />
                    </div>
                  </div>
                  {/* Slider */}
                  <div className="flex justify-between text-xs text-gray-700 mb-2 font-normal">
                    <span>₹{priceRange[0].toLocaleString()}</span>
                    <span>₹{priceRange[1].toLocaleString()}</span>
                  </div>
                  <div className="relative pt-1">
                    <div className="w-full h-1 bg-gray-200 rounded-lg">
                      <div
                        className="absolute h-1 bg-[#F2631F] rounded-lg"
                        style={{ width: `${(priceRange[1] / 1000000) * 100}%` }}
                      ></div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1000000"
                      step="10000"
                      value={priceRange[1]}
                      onChange={(e) => {setPriceRange([priceRange[0], parseInt(e.target.value)])}}
                      className="absolute top-0 w-full h-2 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Ratings Filter */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">Ratings</h4>
                {(() => {
                  const selectedRatingValue = selectedRatings && selectedRatings.length > 0 ? parseFloat(selectedRatings[0]) : 0;
                  return (
                    <div className="flex items-center">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map(star => {
                          const isFull = selectedRatingValue >= star;
                          const isHalf = selectedRatingValue >= star - 0.5 && selectedRatingValue < star;
                          return (
                            <div key={star} className="relative cursor-pointer" style={{ width: 28, height: 28 }} onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const clickX = e.clientX - rect.left;
                              const rating = clickX < rect.width / 2 ? star - 0.5 : star;
                              setSelectedRatings([rating.toString()]);
                            }}>
                              <Star className="text-gray-300" fill="currentColor" size={28}/>
                              {isFull ? (
                                <div className="absolute top-0 left-0">
                                  <Star className="text-yellow-400" fill="currentColor" size={28}/>
                                </div>
                              ) : isHalf ? (
                                <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
                                  <Star className="text-yellow-400" fill="currentColor" size={28}/>
                                </div>
                              ) : null}
                            </div>
                          )
                        })}
                      </div>
                      {selectedRatingValue > 0 && (
                        <span className="ml-2 text-sm font-medium text-gray-700">{selectedRatingValue}★ & up</span>
                      )}
                    </div>
                  )
                })()}
              </div>
            </div>
            
            <div className="p-4 border-t bg-gray-50">
              <div className="flex gap-2">
                <button
                  onClick={resetFilters}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:border-[#F2631F] transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="flex-1 px-4 py-2 bg-[#F2631F] text-white rounded-lg hover:bg-[#e55a1a] transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sort Dropdown */}
      {isMobileSortOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden">
          <div ref={mobileSortRef} className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Sort By</h3>
                <button onClick={() => setIsMobileSortOpen(false)} className="p-2">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-2">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSort(option.value)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      selectedSort === option.value
                        ? 'bg-orange-50 text-[#F2631F]'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoProductsPage; 