import React, { useMemo, useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAppState } from 'state/AppStateContext';
import search from 'assets/windowsIcons/299(32x32).png';
import folderOpen from 'assets/windowsIcons/337(32x32).png';
import go from 'assets/windowsIcons/290.png';
import computer from 'assets/windowsIcons/676(16x16).png';
import dropdown from 'assets/windowsIcons/dropdown.png';
import pullup from 'assets/windowsIcons/pullup.png';
import windows from 'assets/windowsIcons/windows.png';
import { WindowDropDowns } from 'components';
import mcDropDownData from 'WinXP/apps/MyComputer/dropDownData';
import back from 'assets/windowsIcons/back.png';
import forward from 'assets/windowsIcons/forward.png';
import up from 'assets/windowsIcons/up.png';

function Catalog() {
  const { state, dispatch, ACTIONS, supabase } = useAppState();
  const [detailId, setDetailId] = useState(null);
  const [query, setQuery] = useState(state.catalog.query || '');
  const [brandId, setBrandId] = useState(state.catalog.brandId || 'all');
  const [category, setCategory] = useState(state.catalog.category || 'all');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Detectar si el usuario es administrador/vendedor
  const userRole = state.user && (state.user.role || (state.user.user_metadata && state.user.user_metadata.role));
  const roleStr = (userRole ? String(userRole) : '').toLowerCase();
  const emailStr = state.user && state.user.email ? String(state.user.email).toLowerCase() : '';
  const isEmployee = (emailStr === 'nacho_g88@hotmail.com') || (!!roleStr && ['empleado','employee'].some(r => roleStr.includes(r)));
  const isAdmin = !!emailStr && !isEmployee;
  
  useEffect(() => {
    // si hay filtros guardados restrictivos, reseteamos para mostrar resultados
    if (state.catalog.brandId && state.catalog.brandId !== 'all') setBrandId('all');
    if (state.catalog.category && state.catalog.category !== 'all') setCategory('all');
    if (state.catalog.query) setQuery('');
    
    // Actualizar datos automáticamente al cargar el catálogo
    refreshFromSupabase();
    
    // Configurar actualización automática cada 30 segundos
    const interval = setInterval(() => {
      refreshFromSupabase();
    }, 30000);
    
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const products = useMemo(() => {
    let list = state.products;
    if (query) list = list.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
    if (brandId !== 'all') list = list.filter(p => p.brandId === brandId);
    if (category !== 'all') list = list.filter(p => (p.category || 'general') === category);
    return list;
  }, [state.products, query, brandId, category]);

  function saveFilters() {
    dispatch({ type: ACTIONS.SET_CATALOG_FILTERS, payload: { query, brandId, category } });
  }
  async function refreshFromSupabase() {
    if (isRefreshing) return; // Evitar múltiples actualizaciones simultáneas
    
    setIsRefreshing(true);
    try {
      if (supabase && supabase.from) {
        console.log('🔄 Iniciando actualización del catálogo...');
        console.log('Usuario actual:', state.user);
        console.log('¿Conexión a Supabase activa?:', !!supabase);
        console.log('URL de Supabase:', process.env.REACT_APP_SUPABASE_URL);
        console.log('¿Tiene clave anónima?:', !!process.env.REACT_APP_SUPABASE_ANON_KEY);
        
        // Prueba de conexión directa
        try {
          const { data: testData, error: testError } = await supabase
            .from('brands')
            .select('count')
            .limit(1);
          console.log('🧪 Prueba de conexión directa:', { testData, testError });
        } catch (testErr) {
          console.log('❌ Error en prueba de conexión:', testErr);
        }
        
        // Actualizar marcas - SOLUCIÓN TEMPORAL: deshabilitar RLS
        console.log('🔑 Usuario identificado como administrador, intentando consulta sin RLS...');
        
        // Intentar múltiples métodos para obtener todas las marcas
        let brands = null;
        let brandsError = null;
        
        try {
          // Método 1: Consulta normal
          const result1 = await supabase.from('brands').select('*');
          brands = result1.data;
          brandsError = result1.error;
          
          if (brandsError || !brands || brands.length === 0) {
            console.log('⚠️ Consulta normal falló, intentando con RPC...');
            
            // Método 2: Intentar RPC
            try {
              const result2 = await supabase.rpc('get_all_brands_admin');
              if (result2.data) {
                brands = result2.data;
                brandsError = null;
              }
            } catch (rpcError) {
              console.log('⚠️ RPC no disponible:', rpcError);
            }
            
            // Método 3: Consulta directa con SQL (si es posible)
            if (!brands || brands.length === 0) {
              console.log('⚠️ Intentando consulta SQL directa...');
              try {
                const { data: sqlResult } = await supabase
                  .from('brands')
                  .select('*')
                  .limit(100); // Limitar para evitar problemas
                brands = sqlResult;
                brandsError = null;
              } catch (sqlError) {
                console.log('❌ Error en consulta SQL:', sqlError);
              }
            }
          }
        } catch (error) {
          console.log('❌ Error general en consulta de marcas:', error);
          brandsError = error;
        }
          
        console.log('📊 Resultado consulta marcas:', { 
          brands: brands, 
          error: brandsError,
          count: brands ? brands.length : 0
        });
        
        if (!brandsError && Array.isArray(brands)) {
          const mappedBrands = brands.map(x => ({ 
            id: x.id, 
            name: x.name, 
            description: x.description || '', 
            logo: x.logo || '',
            user_id: x.user_id // Incluir user_id para debugging
          }));
          dispatch({ type: ACTIONS.SET_BRANDS, payload: mappedBrands });
          console.log('✅ Marcas mapeadas correctamente:', mappedBrands);
        } else if (brandsError) {
          console.error('❌ Error al obtener marcas:', brandsError);
        }
        
        // Actualizar productos - SOLUCIÓN TEMPORAL: múltiples métodos
        console.log('🔑 Intentando obtener todos los productos...');
        
        let products = null;
        let productsError = null;
        
        try {
          // Método 1: Consulta normal
          const result1 = await supabase.from('products').select('*');
          products = result1.data;
          productsError = result1.error;
          
          if (productsError || !products || products.length === 0) {
            console.log('⚠️ Consulta normal de productos falló, intentando alternativas...');
            
            // Método 2: Intentar RPC
            try {
              const result2 = await supabase.rpc('get_all_products_admin');
              if (result2.data) {
                products = result2.data;
                productsError = null;
              }
            } catch (rpcError) {
              console.log('⚠️ RPC de productos no disponible:', rpcError);
            }
            
            // Método 3: Consulta directa con SQL
            if (!products || products.length === 0) {
              console.log('⚠️ Intentando consulta SQL directa de productos...');
              try {
                const { data: sqlResult } = await supabase
                  .from('products')
                  .select('*')
                  .limit(100);
                products = sqlResult;
                productsError = null;
              } catch (sqlError) {
                console.log('❌ Error en consulta SQL de productos:', sqlError);
              }
            }
          }
        } catch (error) {
          console.log('❌ Error general en consulta de productos:', error);
          productsError = error;
        }
          
        console.log('📦 Resultado consulta productos:', { 
          products: products, 
          error: productsError,
          count: products ? products.length : 0
        });
        
        if (!productsError && Array.isArray(products)) {
          const mappedProducts = products.map(x => ({ 
            id: x.id, 
            name: x.name, 
            description: x.description || '', 
            category: x.category || 'general', 
            brandId: x.brand_id, // Usar brand_id de Supabase
            price: Number(x.price || 0), 
            image: x.image || '',
            user_id: x.user_id // Incluir user_id para debugging
          }));
          dispatch({ type: ACTIONS.SET_PRODUCTS, payload: mappedProducts });
          console.log('✅ Productos mapeados correctamente:', mappedProducts);
        } else if (productsError) {
          console.error('❌ Error al obtener productos:', productsError);
        }
        
        setLastUpdate(new Date());
        console.log('✅ Catálogo actualizado desde Supabase:', { 
          brands: (brands && brands.length) || 0, 
          products: (products && products.length) || 0 
        });
      }
    } catch (error) {
      console.error('❌ Error al actualizar catálogo:', error);
    } finally {
      setIsRefreshing(false);
    }
  }

  const brandName = id => {
    const found = state.brands.find(b => b.id === id);
    return (found && found.name) || '—';
  };

  return (
    <Div>
      <section className="com__toolbar">
        <div className="com__options">
          <WindowDropDowns items={mcDropDownData} onClickItem={() => {}} />
        </div>
        <img className="com__windows-logo" src={windows} alt="windows" />
      </section>
      <section className="com__function_bar">
        <div className="com__function_bar__button--disable">
          <img className="com__function_bar__icon" src={back} alt="" />
          <span className="com__function_bar__text">Atrás</span>
          <div className="com__function_bar__arrow" />
        </div>
        <div className="com__function_bar__button--disable">
          <img className="com__function_bar__icon" src={forward} alt="" />
          <div className="com__function_bar__arrow" />
        </div>
        <div className="com__function_bar__button">
          <img className="com__function_bar__icon--normalize" src={up} alt="" />
        </div>
        <div className="com__function_bar__separate" />
        <div className="com__function_bar__button">
          <img className="com__function_bar__icon--normalize" src={search} alt="" />
          <span className="com__function_bar__text">Buscar</span>
        </div>
        <div className="com__function_bar__button">
          <img className="com__function_bar__icon--normalize" src={folderOpen} alt="" />
          <span className="com__function_bar__text">Carpetas</span>
        </div>
      </section>
      <section className="com__address_bar">
        <div className="com__address_bar__title">Dirección</div>
        <div className="com__address_bar__content">
          <img src={computer} alt="ie" className="com__address_bar__content__img" />
          <div className="com__address_bar__content__text">Catálogo</div>
          <img src={dropdown} alt="dropdown" className="com__address_bar__content__img" />
        </div>
        <div className="com__address_bar__go">
          <img className="com__address_bar__go__img" src={go} alt="go" />
          <span className="com__address_bar__go__text">Ir</span>
        </div>
      </section>
      <div className="com__content">
        <div className="com__content__inner">
          <div className="com__content__left">
            <div className="com__content__left__card">
              <div className="com__content__left__card__header">
                <div className="com__content__left__card__header__text">Filtros</div>
                <img src={pullup} alt="" className="com__content__left__card__header__img" />
              </div>
              <div className="com__content__left__card__content">
                {/* Buscador */}
                <div className="com__content__left__card__row">
                  <div style={{ 
                    background: 'linear-gradient(135deg, #f8f9ff 0%, #e8f0ff 100%)',
                    border: '1px solid #b0c4ff',
                    borderRadius: '6px',
                    padding: '8px',
                    marginBottom: '8px',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                  }}>
                    <label style={{ 
                      fontSize: '11px', 
                      color: '#0c327d', 
                      marginBottom: '4px', 
                      display: 'block',
                      fontWeight: 'bold',
                      textShadow: '0 1px 1px rgba(255,255,255,0.8)'
                    }}>
                      <img src={search} alt="" style={{ width: '14px', height: '14px', marginRight: '6px', verticalAlign: 'middle' }} />
                      Buscar productos
                    </label>
                    <input 
                      type="text" 
                      placeholder="Ej: iPhone" 
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      style={{ 
                        width: '100%', 
                        padding: '6px 8px', 
                        fontSize: '12px', 
                        border: '1px solid #7aa2e8',
                        borderRadius: '4px',
                        background: '#fff',
                        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
                        outline: 'none',
                        transition: 'all 0.2s ease'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#4a90e2'}
                      onBlur={(e) => e.target.style.borderColor = '#7aa2e8'}
                    />
                  </div>
                </div>

                {/* Filtro de Marca */}
                <div className="com__content__left__card__row">
                  <div style={{ 
                    background: 'linear-gradient(135deg, #f0f8ff 0%, #e0f0ff 100%)',
                    border: '1px solid #a8c8ff',
                    borderRadius: '6px',
                    padding: '8px',
                    marginBottom: '8px',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                  }}>
                    <label style={{ 
                      fontSize: '11px', 
                      color: '#0c327d', 
                      marginBottom: '4px', 
                      display: 'block',
                      fontWeight: 'bold',
                      textShadow: '0 1px 1px rgba(255,255,255,0.8)'
                    }}>Marca</label>
                    <select 
                      value={brandId}
                      onChange={e => setBrandId(e.target.value)}
                      style={{ 
                        width: '100%', 
                        padding: '6px 8px', 
                        fontSize: '12px', 
                        border: '1px solid #7aa2e8',
                        borderRadius: '4px',
                        background: '#fff',
                        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="all">Todas las marcas</option>
                      {state.brands.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Filtro de Categoría */}
                <div className="com__content__left__card__row">
                  <div style={{ 
                    background: 'linear-gradient(135deg, #f0f8ff 0%, #e0f0ff 100%)',
                    border: '1px solid #a8c8ff',
                    borderRadius: '6px',
                    padding: '8px',
                    marginBottom: '8px',
                    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                  }}>
                    <label style={{ 
                      fontSize: '11px', 
                      color: '#0c327d', 
                      marginBottom: '4px', 
                      display: 'block',
                      fontWeight: 'bold',
                      textShadow: '0 1px 1px rgba(255,255,255,0.8)'
                    }}>Categoría</label>
                    <select 
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      style={{ 
                        width: '100%', 
                        padding: '6px 8px', 
                        fontSize: '12px', 
                        border: '1px solid #7aa2e8',
                        borderRadius: '4px',
                        background: '#fff',
                        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="all">Todas las categorías</option>
                      <option value="general">General</option>
                      <option value="otros">Otros</option>
                    </select>
                  </div>
                </div>

                {/* Separador visual */}
                <div style={{ height: '1px', background: '#bdb8a6', margin: '8px 0' }}></div>

                {/* Botones de acción */}
                <div className="com__content__left__card__row">
                  <button 
                    onClick={() => { setQuery(''); setBrandId('all'); setCategory('all'); }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%)',
                      border: '1px solid #d32f2f',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.3)',
                      textShadow: '0 1px 1px rgba(0,0,0,0.3)',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                      marginBottom: '6px'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = 'linear-gradient(135deg, #ff5252 0%, #f44336 100%)';
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = '0 3px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%)';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.3)';
                    }}
                    onMouseDown={(e) => {
                      e.target.style.transform = 'translateY(1px)';
                      e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.3)';
                    }}
                    onMouseUp={(e) => {
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = '0 3px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)';
                    }}
                  >
                    🗑️ Limpiar
                  </button>
                </div>

              </div>
            </div>
          </div>
          <div className="com__content__right">
            <div className="com__content__right__card">
              <div className="com__content__right__card__header">
                Productos
              </div>
              <div className="com__content__right__card__content">
                {!detailId && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12, width: '100%' }}>
                    {products.length === 0 && (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '20px', 
                        color: '#666',
                        backgroundColor: '#f9f9f9',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}>
                        <div>No hay productos que coincidan con los filtros.</div>
                        <div style={{ marginTop: '8px', fontSize: '12px' }}>
                          {state.products.length === 0 
                            ? 'No hay productos en la base de datos. Usa "Actualizar" para sincronizar.' 
                            : 'Prueba cambiar los filtros o usar "Actualizar" para obtener los últimos datos.'
                          }
                        </div>
                      </div>
                    )}
                    {products.map(p => (
                      <div key={p.id} style={{ 
                        border: '1px solid #b0c4ff', 
                        background: '#fff', 
                        boxShadow: 'inset 0 0 0 1px #dde6ff',
                        fontFamily: 'Tahoma, Arial, sans-serif'
                      }}>
                        {/* Imagen del producto */}
                        <div style={{ 
                          height: 140, 
                          background: '#f4f4f4', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          borderBottom: '1px solid #ccd6ff',
                          position: 'relative'
                        }}>
                          {p.image ? (
                            <img 
                              alt={p.name} 
                              src={p.image} 
                              style={{ 
                                maxWidth: '100%', 
                                maxHeight: '100%'
                              }} 
                            />
                          ) : (
                            <div style={{ 
                              display: 'flex', 
                              flexDirection: 'column', 
                              alignItems: 'center', 
                              color: '#888',
                              fontSize: '12px'
                            }}>
                              <span style={{ fontSize: '24px', marginBottom: '4px' }}>🖼️</span>
                              <span>Sin imagen</span>
                            </div>
                          )}
                          {/* Badge de categoría estilo Windows XP */}
                          <div style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            background: '#316ac5',
                            color: 'white',
                            padding: '2px 6px',
                            fontSize: '9px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            border: '1px solid #1e4a8c',
                            boxShadow: 'inset 0 1px 0 #5a8ddb'
                          }}>
                            {p.category || 'General'}
                          </div>
                        </div>
                        
                        {/* Contenido de la tarjeta */}
                        <div style={{ padding: '8px' }}>
                          {/* Nombre del producto */}
                          <div style={{ 
                            fontWeight: 'bold', 
                            textAlign: 'center',
                            fontSize: '13px',
                            color: '#000',
                            marginBottom: '6px'
                          }}>
                            {p.name}
                          </div>
                          
                          {/* Información del producto */}
                          <div style={{ marginBottom: '8px' }}>
                            <div style={{ 
                              fontSize: 11, 
                              color: '#333', 
                              marginBottom: '2px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <span style={{ marginRight: '4px', fontSize: '10px' }}>🏷️</span>
                              <span>{brandName(p.brandId)}</span>
                            </div>
                          </div>
                          
                          {/* Precio */}
                          <div style={{ 
                            color: '#008000', 
                            fontWeight: 'bold', 
                            marginBottom: '8px',
                            textAlign: 'center',
                            fontSize: '14px'
                          }}>
                            ${p.price}
                          </div>
                          
                          {/* Botón de acción estilo Windows XP */}
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <button 
                              onClick={() => setDetailId(p.id)}
                              style={{
                                padding: '6px 16px',
                                background: 'linear-gradient(to bottom, #f0f0f0 0%, #d0d0d0 100%)',
                                border: '1px solid #999',
                                borderRadius: '3px',
                                color: '#000',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                fontFamily: 'Tahoma, Arial, sans-serif',
                                boxShadow: 'inset 0 1px 0 #fff, 0 1px 0 #999',
                                transition: 'all 0.1s ease'
                              }}
                              onMouseDown={(e) => {
                                e.target.style.background = 'linear-gradient(to bottom, #d0d0d0 0%, #f0f0f0 100%)';
                                e.target.style.boxShadow = 'inset 0 1px 0 #999, 0 1px 0 #fff';
                              }}
                              onMouseUp={(e) => {
                                e.target.style.background = 'linear-gradient(to bottom, #f0f0f0 0%, #d0d0d0 100%)';
                                e.target.style.boxShadow = 'inset 0 1px 0 #fff, 0 1px 0 #999';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = 'linear-gradient(to bottom, #f0f0f0 0%, #d0d0d0 100%)';
                                e.target.style.boxShadow = 'inset 0 1px 0 #fff, 0 1px 0 #999';
                              }}
                            >
                              <span style={{ fontSize: '10px' }}>👁️</span>
                              Ver
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {detailId && (
                  <div style={{ width: '100%' }}>
                    <button 
                      onClick={() => setDetailId(null)}
                      style={{
                        padding: '8px 16px',
                        background: 'linear-gradient(to bottom, #f0f0f0 0%, #d0d0d0 100%)',
                        border: '1px solid #999',
                        borderRadius: '3px',
                        color: '#000',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontFamily: 'Tahoma, Arial, sans-serif',
                        boxShadow: 'inset 0 1px 0 #fff, 0 1px 0 #999',
                        marginBottom: '16px'
                      }}
                      onMouseDown={(e) => {
                        e.target.style.background = 'linear-gradient(to bottom, #d0d0d0 0%, #f0f0f0 100%)';
                        e.target.style.boxShadow = 'inset 0 1px 0 #999, 0 1px 0 #fff';
                      }}
                      onMouseUp={(e) => {
                        e.target.style.background = 'linear-gradient(to bottom, #f0f0f0 0%, #d0d0d0 100%)';
                        e.target.style.boxShadow = 'inset 0 1px 0 #fff, 0 1px 0 #999';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = 'linear-gradient(to bottom, #f0f0f0 0%, #d0d0d0 100%)';
                        e.target.style.boxShadow = 'inset 0 1px 0 #fff, 0 1px 0 #999';
                      }}
                    >
                      <span>←</span>
                      Volver
                    </button>
                    {(() => {
                      const p = state.products.find(x => x.id === detailId);
                      if (!p) return <div>Producto no encontrado</div>;
                      return (
                        <div style={{ 
                          marginTop: 12, 
                          display: 'grid', 
                          gridTemplateColumns: '280px 1fr', 
                          gap: 16,
                          background: '#fff',
                          border: '1px solid #b0c4ff',
                          borderRadius: '6px',
                          padding: '16px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                          <div>
                            {p.image ? (
                              <img 
                                alt={p.name} 
                                src={p.image} 
                                style={{ 
                                  width: '100%', 
                                  height: 'auto',
                                  borderRadius: '4px',
                                  border: '1px solid #ddd'
                                }} 
                              />
                            ) : (
                              <div style={{ 
                                width: '100%', 
                                height: 200, 
                                background: '#f4f4f4', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                borderRadius: '4px',
                                border: '1px solid #ddd',
                                color: '#888',
                                fontSize: '14px'
                              }}>
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🖼️</div>
                                  <div>Sin imagen</div>
                                </div>
                              </div>
                            )}
                          </div>
                          <div style={{ fontFamily: 'Tahoma, Arial, sans-serif' }}>
                            <h3 style={{ 
                              marginTop: 0, 
                              color: '#000',
                              fontSize: '18px',
                              fontWeight: 'bold',
                              marginBottom: '12px'
                            }}>
                              {p.name}
                            </h3>
                            
                            <div style={{ 
                              background: '#f0f0f0',
                              border: '1px solid #999',
                              padding: '12px',
                              borderRadius: '4px',
                              marginBottom: '12px',
                              boxShadow: 'inset 0 1px 0 #fff, 0 1px 0 #999'
                            }}>
                              <div style={{ 
                                fontSize: '12px', 
                                fontWeight: 'bold', 
                                color: '#000', 
                                marginBottom: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <span>ℹ️</span>
                                Información del producto
                              </div>
                              
                              <div style={{ marginBottom: '6px' }}>
                                <strong>Marca:</strong> {brandName(p.brandId)}
                              </div>
                              <div style={{ marginBottom: '6px' }}>
                                <strong>Categoría:</strong> {p.category || 'general'}
                              </div>
                              <div style={{ 
                                marginBottom: '6px',
                                color: '#008000',
                                fontWeight: 'bold',
                                fontSize: '16px'
                              }}>
                                <strong>Precio:</strong> ${p.price}
                              </div>
                            </div>
                            
                            {p.description && (
                              <div style={{ 
                                background: '#f0f0f0',
                                border: '1px solid #999',
                                padding: '12px',
                                borderRadius: '4px',
                                boxShadow: 'inset 0 1px 0 #fff, 0 1px 0 #999'
                              }}>
                                <div style={{ 
                                  fontSize: '12px', 
                                  fontWeight: 'bold', 
                                  color: '#000', 
                                  marginBottom: '8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}>
                                  <span>📝</span>
                                  Descripción
                                </div>
                                <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                                  {p.description}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de estado */}
      <div style={{ marginTop: 8, background: '#e8e4cf', border: '1px solid #b8b4a2', padding: '6px 8px', fontSize: 11 }}>
        Estado: Sistema operativo | Productos: {state.products.length} | Última actualización: {lastUpdate.toLocaleString()}
      </div>
    </Div>
  );
}

const Div = styled.div`
  height: 100%;
  width: 100%;
  position: absolute;
  display: flex;
  overflow: hidden;
  flex-direction: column;
  background: linear-gradient(to right, #edede5 0%, #ede8cd 100%);
  .com__toolbar { position: relative; display:flex; align-items:center; line-height:100%; height: 24px; border-bottom: 1px solid rgba(255,255,255,0.7); flex-shrink:0; }
  .com__options { height:23px; border-bottom:1px solid rgba(0,0,0,0.1); border-right:1px solid rgba(0,0,0,0.1); padding:1px 0 1px 2px; border-left:0; flex:1; }
  .com__windows-logo { height:100%; border-left:1px solid white; border-bottom:1px solid rgba(0,0,0,0.1); }
  .com__function_bar { height: 36px; display: flex; align-items: center; font-size: 11px; padding: 1px 3px 0; border-bottom: 1px solid rgba(0,0,0,0.1); }
  .com__function_bar__button { display:flex; align-items:center; height:100%; border: 1px solid rgba(0,0,0,0); border-radius:3px; }
  .com__function_bar__button:hover { border:1px solid rgba(0,0,0,0.1); box-shadow: inset 0 -1px 1px rgba(0,0,0,0.1); }
  .com__function_bar__button:hover:active { border:1px solid rgb(185,185,185); background:#dedede; box-shadow: inset 0 -1px 1px rgba(255,255,255,0.7); color: rgba(255,255,255,0.7); }
  .com__function_bar__icon--normalize { height:22px; width:22px; margin: 0 4px 0 1px; }
  .com__function_bar__text { margin-right: 4px; }
  .com__function_bar__icon { height:30px; width:30px; }
  .com__function_bar__button--disable { filter: grayscale(1); opacity:0.7; display:flex; height:100%; align-items:center; border:1px solid rgba(0,0,0,0); }
  .com__function_bar__separate { height:90%; width:1px; background-color: rgba(0,0,0,0.2); margin: 0 2px; }
  .com__function_bar__arrow { height:100%; display:flex; align-items:center; margin: 0 4px; }
  .com__function_bar__arrow:before { content:''; display:block; border-width:3px 3px 0; border-color:#000 transparent; border-style: solid; }
  .com__address_bar { flex-shrink:0; border-top:1px solid rgba(255,255,255,0.7); height:20px; font-size:11px; display:flex; align-items:center; padding:0 2px; box-shadow: inset 0 -2px 3px -1px #b0b0b0; }
  .com__address_bar__title { color: rgba(0,0,0,0.5); padding:5px; }
  .com__address_bar__content { border: rgba(122,122,255,0.6) 1px solid; height:100%; display:flex; flex:1; align-items:center; background:#fff; position:relative; }
  .com__address_bar__content__img { width:14px; height:14px; }
  .com__address_bar__content__img:last-child { width:15px; height:15px; right:1px; position:absolute; }
  .com__address_bar__content__text { white-space:nowrap; position:absolute; left:16px; right:17px; }
  .com__address_bar__go { display:flex; align-items:center; padding:0 18px 0 5px; height:100%; }
  .com__address_bar__go__img { height:95%; border:1px solid rgba(255,255,255,0.2); margin-right:3px; }
  .com__content { flex:1; border:1px solid rgba(0,0,0,0.4); border-top-width:0; background:#f1f1f1; overflow:auto; font-size:11px; position:relative; }
  .com__content__inner { display:flex; height:100%; overflow:auto; }
  .com__content__left { width:180px; height:100%; background: linear-gradient(to bottom, #748aff 0%, #4057d3 100%); overflow:auto; padding:10px; }
  .com__content__left__card { border-top-left-radius:3px; border-top-right-radius:3px; width:100%; overflow:hidden; }
  .com__content__left__card:not(:last-child) { margin-bottom:12px; }
  .com__content__left__card__header { display:flex; align-items:center; height:23px; padding-left:11px; padding-right:2px; cursor:pointer; background: linear-gradient(to right, rgb(240,240,255) 0, rgb(240,240,255) 30%, rgb(168,188,255) 100%); }
  .com__content__left__card__header__text { font-weight:700; color:#0c327d; flex:1; }
  .com__content__left__card__header__img { width:18px; height:18px; filter: drop-shadow(1px 1px 3px rgba(0,0,0,0.3)); }
  .com__content__left__card__content { padding:5px 10px; background: linear-gradient(to right, rgb(180,200,251) 0%, rgb(164,185,251) 50%, rgb(180,200,251) 100%); background-color: rgba(198,211,255,0.87); }
  .com__content__left__card__row { display:flex; margin-bottom:4px; }
  .btn { background: linear-gradient(#fefefe,#e7e7e7); border: 1px solid #7aa2e8; padding: 3px 8px; cursor: pointer; }
  .label { font-size: 10px; color: #0c327d; margin-bottom: 2px; }
  .input { width: 100%; }
  .com__content__right { height:100%; overflow:auto; background:#fff; flex:1; }
  .com__content__right__card__header { width:300px; font-weight:700; padding: 2px 0 3px 12px; position:relative; }
  .com__content__right__card__header:after { content:''; display:block; background: linear-gradient(to right, #70bfff 0, #fff 100%); position:absolute; bottom:0; left:-12px; height:1px; width:100%; }
  .com__content__right__card__content { display:flex; align-items:flex-start; padding:15px 15px 0; flex-wrap:wrap; }
`;

export default Catalog;


