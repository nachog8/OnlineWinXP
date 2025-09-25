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
  useEffect(() => {
    // si hay filtros guardados restrictivos, reseteamos para mostrar resultados
    if (state.catalog.brandId && state.catalog.brandId !== 'all') setBrandId('all');
    if (state.catalog.category && state.catalog.category !== 'all') setCategory('all');
    if (state.catalog.query) setQuery('');
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
    try {
      if (supabase && supabase.from) {
        const { data: b } = await supabase.from('brands').select('*');
        if (Array.isArray(b)) dispatch({ type: ACTIONS.SET_BRANDS, payload: b.map(x => ({ id: x.id, name: x.name, description: x.description || '', logo: x.logo || '' })) });
        const { data: p } = await supabase.from('products').select('*');
        if (Array.isArray(p)) dispatch({ type: ACTIONS.SET_PRODUCTS, payload: p.map(x => ({ id: x.id, name: x.name, description: x.description || '', category: x.category || 'general', brandId: x.brand_id || x.brandId || '', price: Number(x.price || 0), image: x.image || '' })) });
      }
    } catch (_e) {}
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
                <div className="com__content__left__card__row">
                  <label className="label">Buscar</label>
                </div>
                <div className="com__content__left__card__row">
                  <input className="input" placeholder="Ej: iPhone" value={query} onChange={e => setQuery(e.target.value)} />
                </div>
                <div className="com__content__left__card__row">
                  <label className="label">Marca</label>
                </div>
                <div className="com__content__left__card__row">
                  <select className="input" value={brandId} onChange={e => setBrandId(e.target.value)}>
                    <option value="all">Todas las marcas</option>
                    {state.brands.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
                  </select>
                </div>
                <div className="com__content__left__card__row">
                  <label className="label">Categoría</label>
                </div>
                <div className="com__content__left__card__row">
                  <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="all">Todas las categorías</option>
                    <option value="general">General</option>
                    <option value="otros">Otros</option>
                  </select>
                </div>
                <div className="com__content__left__card__row">
                  <button className="btn" onClick={saveFilters}>Guardar filtros</button>
                </div>
                <div className="com__content__left__card__row">
                  <button className="btn" onClick={() => { setQuery(''); setBrandId('all'); setCategory('all'); }}>Limpiar</button>
                </div>
                <div className="com__content__left__card__row">
                  <button className="btn" onClick={refreshFromSupabase}>Actualizar</button>
                </div>
              </div>
            </div>
          </div>
          <div className="com__content__right">
            <div className="com__content__right__card">
              <div className="com__content__right__card__header">Productos</div>
              <div className="com__content__right__card__content">
                {!detailId && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12, width: '100%' }}>
                    {products.length === 0 && <div>No hay productos. Usa “Actualizar”.</div>}
                    {products.map(p => (
                      <div key={p.id} style={{ border: '1px solid #b0c4ff', background: '#fff', boxShadow: 'inset 0 0 0 1px #e6efff' }}>
                        <div style={{ height: 140, background: '#f9fbff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #d7e2ff' }}>
                          {p.image ? <img alt={p.name} src={p.image} style={{ maxWidth: '100%', maxHeight: '100%' }} /> : <span style={{ color: '#888' }}>Sin imagen</span>}
                        </div>
                        <div style={{ padding: 10 }}>
                          <div style={{ fontWeight: 'bold' }}>{p.name}</div>
                          <div style={{ fontSize: 12, color: '#333', marginTop: 2 }}>{brandName(p.brandId)} • ${p.price}</div>
                          <div style={{ marginTop: 6 }}>
                            <button className="btn" onClick={() => setDetailId(p.id)}>Ver</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {detailId && (
                  <div style={{ width: '100%' }}>
                    <button onClick={() => setDetailId(null)}>Volver</button>
                    {(() => {
                      const p = state.products.find(x => x.id === detailId);
                      if (!p) return <div>Producto no encontrado</div>;
                      return (
                        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
                          <div>
                            {p.image ? (
                              <img alt={p.name} src={p.image} style={{ width: '100%', height: 'auto' }} />
                            ) : (
                              <div style={{ width: '100%', height: 200, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Sin imagen</div>
                            )}
                          </div>
                          <div>
                            <h3 style={{ marginTop: 0 }}>{p.name}</h3>
                            <div>Marca: {brandName(p.brandId)}</div>
                            <div>Categoría: {p.category || 'general'}</div>
                            <div>Precio: ${p.price}</div>
                            <div style={{ marginTop: 8 }}>Descripción: {p.description || '—'}</div>
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


