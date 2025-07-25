import React from 'react';
import '../styles/globals.css';
import Header from '../components/shop/shop3/ProductPage/Header';
import ProductPage from '../components/shop/shop3/ProductPage/ProductPage';
import Finishing from '../components/shop/shop3/ProductPage/Finishing';

function Shop3Productpage() {
  React.useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <div className="min-h-screen bg-white scroll-smooth overflow-x-hidden">
      <Header />
     <ProductPage />
     <Finishing />
    </div>  
  );
}

export default Shop3Productpage;