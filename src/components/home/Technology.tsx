import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Heart, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { Product } from '../../types';

const products: Product[] = [
  {
    id: '1',
    name: 'Apple Macbook Pro 2019',
    description: '',
    price: 690.38,
    originalPrice: 789.24,
    currency: 'USD',
    image: '/assets/products/technology/apple-macbook-pro-1.png',
    category: 'Laptop',
    rating: 4.5,
    reviews: 245,
    stock: 10,
    tags: ['laptop', 'apple', 'macbook'],
    isNew: true
  },
  {
    id: '2',
    name: 'Apple Watch Series 5',
    description: '',
    price: 132.90,
    originalPrice: 159.34,
    currency: 'USD',
    image: '/assets/products/technology/apple-watch-series-1.png',
    category: 'Smart Watch',
    rating: 4.8,
    reviews: 189,
    stock: 15,
    tags: ['watch', 'apple', 'smart watch'],
    featured: false,
    favourite: true
  },
  {
    id: '3',
    name: 'Apple Macbook Pro 2019',
    description: '',
    price: 69.04,
    currency: 'USD',
    image: '/assets/products/technology/apple-macbook-pro-2.png',
    category: 'Laptop',
    rating: 4.7,
    reviews: 156,
    stock: 0,
    tags: ['laptop', 'apple', 'macbook'],
    featured: false
  },
  {
    id: '4',
    name: 'Apple Watch Series 5',
    description: '',
    price: 132.90,
    currency: 'USD',
    image: '/assets/products/technology/apple-watch-series-2.png',
    category: 'Smart Watch',
    rating: 4.6,
    reviews: 132,
    stock: 8,
    tags: ['watch', 'apple', 'smart watch'],
    featured: false
  }
];

const categories = ['All', 'Smart Watch', 'Laptop', 'Tablet', 'Desktop', 'Accessories'];

const Technology: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const navigate = useNavigate();
  const { addToCart } = useCart();

  return (
    <section className="pb-12 px-4 md:px-8">
      <div className="container mx-auto">
        <div className="flex flex-col space-y-6 px-20">
          {/* Header with navigation */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <h2 className="text-2xl font-semibold">Technology</h2>
            
            {/* Categories and Navigation */}
            <div className="flex items-center w-full md:w-auto overflow-x-auto pb-2 md:pb-0 space-x-6">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`whitespace-nowrap ${
                    activeCategory === category
                      ? 'text-[#F2631F] border-b-2 border-[#F2631F]'
                      : 'text-gray-600 hover:text-[#F2631F]'
                  } pb-1`}
                  onClick={() => {
                    setActiveCategory(category);
                    navigate(`/products/${category.toLowerCase()}`);
                  }}
                >
                  {category}
                </button>
              ))}
              <div className="hidden md:flex items-center space-x-2">
                <button className="p-1 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors">
                  <ChevronLeft size={20} />
                </button>
                <button className="p-1 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Products grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col max-w-[280px] w-full mx-auto"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <div className="relative aspect-[3/2] w-full">
                  {/* Product badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
                    {product.isNew && (
                      <span className="bg-[#F2631F] text-white text-[10px] px-1.5 py-0.5 rounded">
                        New
                      </span>
                    )}
                    {product.featured && (
                      <span className="bg-[#F2631F] text-white text-[10px] px-1.5 py-0.5 rounded">
                        Featured
                      </span>
                    )}
                    {product.favourite && (
                      <span className="bg-yellow-400 text-black text-[10px] px-1.5 py-0.5 rounded">
                        Favourite
                      </span>
                    )}
                    {product.stock === 0 && (
                      <span className="bg-gray-400 text-black text-[10px] px-1.5 py-0.5 rounded">
                        Sold Out
                      </span>
                    )}
                  </div>
                  
                  {/* Favorite button */}
                  <button
                    className="absolute top-4 right-4 p-1 z-10 text-gray-400 hover:text-[#F2631F]"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle favorite toggle if needed
                    }}
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                  
                  {/* Product image */}
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-contain p-2"
                  />
                </div>

                <div className="p-3 flex flex-col flex-grow">
                  <h3 className="text-sm font-medium mb-1 line-clamp-1">{product.name}</h3>
                  <div className="mt-auto">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-base font-bold">${product.price.toFixed(2)}</span>
                      {product.originalPrice && (
                        <span className="text-gray-400 text-sm line-through">${product.originalPrice.toFixed(2)}</span>
                      )}
                    </div>
                    <button
                      className="w-1/2 bg-[#F2631F] text-white py-1.5 rounded-md hover:bg-orange-600 transition-colors flex items-center justify-center gap-1.5 text-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      disabled={product.stock === 0}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {product.stock === 0 ? 'Sold Out' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Technology;