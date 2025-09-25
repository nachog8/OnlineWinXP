import React, { useMemo, useState } from 'react';
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

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', marginBottom: 8 }}>
      <div style={{ width: 130 }}>{label}</div>
      <div>{children}</div>
    </div>
  );
}

function Admin({ defaultTab = 'products', showLauncher = false, openCatalog }) {
  const { state, dispatch, ACTIONS, supabase } = useAppState();
  const [tab, setTab] = useState(defaultTab);
  const userRole = state.user && (state.user.role || (state.user.user_metadata && state.user.user_metadata.role));
  const isAdmin = !!userRole && ['admin','administrador','administrator'].some(r => String(userRole).toLowerCase().includes(r));
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Productos
  const [pId, setPId] = useState('');
  const [pName, setPName] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pCategory, setPCategory] = useState('general');
  const [pBrandId, setPBrandId] = useState('');
  const [pPrice, setPPrice] = useState('0');
  const [pImage, setPImage] = useState('');
  const [pPreview, setPPreview] = useState('');

  // Marcas
  const [bId, setBId] = useState('');
  const [bName, setBName] = useState('');
  const [bDesc, setBDesc] = useState('');
  const [bLogo, setBLogo] = useState('');

  const canSaveProduct = useMemo(() => {
    const price = Number(pPrice);
    if (!pName || !pBrandId || Number.isNaN(price) || price < 0) return false;
    return true;
  }, [pName, pBrandId, pPrice]);

  function clearProductForm() {
    setPId(''); setPName(''); setPDesc(''); setPCategory('general'); setPBrandId(''); setPPrice('0'); setPImage(''); setPPreview('');
  }
  function clearBrandForm() {
    setBId(''); setBName(''); setBDesc(''); setBLogo('');
  }

  function loadProduct(id) {
    const p = state.products.find(x => x.id === id);
    if (!p) return;
    setPId(p.id);
    setPName(p.name || '');
    setPDesc(p.description || '');
    setPCategory(p.category || 'general');
    setPBrandId(p.brandId || '');
    setPPrice(String(p.price || 0));
    setPImage(p.image || '');
    setPPreview(p.image || '');
  }
  async function saveProduct() {
    if (!canSaveProduct) return;
    const payload = { id: pId || undefined, name: pName, description: pDesc, category: pCategory, brand_id: pBrandId, price: Number(pPrice), image: pImage };
    try {
      if (supabase && supabase.from) {
        const table = supabase.from('products');
        if (pId) await table.update(payload).eq('id', pId);
        else {
          const { data, error } = await table.insert(payload).select();
          if (!error && Array.isArray(data) && data[0] && data[0].id) payload.id = data[0].id;
        }
      }
    } catch (_e) {}
    dispatch({ type: ACTIONS.UPSERT_PRODUCT, payload: { id: payload.id, name: pName, description: pDesc, category: pCategory, brandId: pBrandId, price: Number(pPrice), image: pImage } });
    clearProductForm();
    setLastUpdate(new Date());
  }
  async function deleteProduct(id) {
    // confirmación
    // eslint-disable-next-line no-alert
    if (window.confirm('¿Eliminar producto?')) {
      try {
        if (supabase && supabase.from) await supabase.from('products').delete().eq('id', id);
      } catch (_e) {}
      dispatch({ type: ACTIONS.DELETE_PRODUCT, payload: id }); setLastUpdate(new Date());
    }
  }

  function loadBrand(id) {
    const b = state.brands.find(x => x.id === id);
    if (!b) return;
    setBId(b.id);
    setBName(b.name || '');
    setBDesc(b.description || '');
    setBLogo(b.logo || '');
  }
  async function saveBrand() {
    if (!bName) return;
    const payload = { id: bId || undefined, name: bName, description: bDesc, logo: bLogo };
    try {
      if (supabase && supabase.from) {
        const table = supabase.from('brands');
        if (bId) await table.update(payload).eq('id', bId);
        else {
          const { data, error } = await table.insert(payload).select();
          if (!error && Array.isArray(data) && data[0] && data[0].id) payload.id = data[0].id;
        }
      }
    } catch (_e) {}
    dispatch({ type: ACTIONS.UPSERT_BRAND, payload: { id: payload.id, name: bName, description: bDesc, logo: bLogo } });
    clearBrandForm();
    setLastUpdate(new Date());
  }
  async function deleteBrand(id) {
    const hasProducts = state.products.some(p => p.brandId === id);
    if (hasProducts) return; // impedimos eliminación si hay productos asociados
    // eslint-disable-next-line no-alert
    if (window.confirm('¿Eliminar marca?')) {
      try {
        if (supabase && supabase.from) await supabase.from('brands').delete().eq('id', id);
      } catch (_e) {}
      dispatch({ type: ACTIONS.DELETE_BRAND, payload: id }); setLastUpdate(new Date());
    }
  }

  if (!isAdmin) {
    return <div style={{ padding: 12 }}>Acceso restringido. Inicia sesión como Administrador.</div>;
  }

  const totalProducts = state.products.length;
  const totalBrands = state.brands.length;

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
          <div className="com__address_bar__content__text">Administrador</div>
          <img src={dropdown} alt="dropdown" className="com__address_bar__content__img" />
        </div>
        <div className="com__address_bar__go">
          <img className="com__address_bar__go__img" src={go} alt="go" />
          <span className="com__address_bar__go__text">Ir</span>
        </div>
      </section>
      {/* Contenido */}
      <div className="com__content">
        <div className="com__content__inner">
          <div className="com__content__left">
            <div className="com__content__left__card">
              <div className="com__content__left__card__header">
                <div className="com__content__left__card__header__text">Herramientas</div>
                <img src={pullup} alt="" className="com__content__left__card__header__img" />
              </div>
              <div className="com__content__left__card__content">
                <div className="com__content__left__card__row"><button style={btn()} onClick={() => setTab('products')}>Productos</button></div>
                <div className="com__content__left__card__row"><button style={btn()} onClick={() => setTab('brands')}>Marcas</button></div>
                {tab === 'products' && <div className="com__content__left__card__row"><button style={btn()} onClick={clearProductForm}>Nuevo producto</button></div>}
                {tab === 'brands' && <div className="com__content__left__card__row"><button style={btn()} onClick={clearBrandForm}>Nueva marca</button></div>}
                <div className="com__content__left__card__row" style={{ color: '#0c327d' }}>Total: {tab === 'products' ? `${totalProducts} productos` : `${totalBrands} marcas`}</div>
              </div>
            </div>
          </div>
          <div className="com__content__right">
            <div className="com__content__right__card">
              <div className="com__content__right__card__header">{tab === 'products' ? 'Catálogo de Productos' : 'Catálogo de Marcas'}</div>
              <div className="com__content__right__card__content" style={{ width: '100%' }}>
                {/* contenido existente del panel */}
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>

      {showLauncher && (
        <div style={{
          background: 'linear-gradient(#e6f0ff,#cfe0ff)',
          border: '1px solid #7aa2e8',
          padding: 10,
          marginBottom: 10,
        }}>
          <strong>Accesos rápidos</strong>
          <div style={{ marginTop: 8 }}>
            <button onClick={() => setTab('products')} style={{ marginRight: 6 }}>Productos</button>
            <button onClick={() => setTab('brands')} style={{ marginRight: 6 }}>Marcas</button>
            <button onClick={() => openCatalog && openCatalog()}>Ver catálogo</button>
        </div>
      </div>
      )}
      <div style={{ marginBottom: 8 }}>
        <button style={btn()} onClick={() => setTab('products')}>Productos</button>{' '}
        <button style={btn()} onClick={() => setTab('brands')}>Marcas</button>
      </div>

      {tab === 'products' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, flex: 1 }}>
          <div style={{ overflow: 'auto' }}>
            <div style={groupHeader()}>Catálogo de Productos</div>
            <div style={groupBody()}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 12 }}>
              {state.products.map(p => (
                <div key={p.id} style={{ border: '1px solid #b0c4ff', background: '#fff', boxShadow: 'inset 0 0 0 1px #dde6ff' }}>
                  <div style={{ height: 140, background: '#f4f4f4', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #ccd6ff' }}>
                    {p.image ? <img alt={p.name} src={p.image} style={{ maxWidth: '100%', maxHeight: '100%' }} /> : <span style={{ color: '#888' }}>Sin imagen</span>}
                  </div>
                  <div style={{ padding: 8 }}>
                    <div style={{ fontWeight: 'bold', textAlign: 'center' }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: '#333', marginTop: 4 }}>Categoría: {p.category || '—'}</div>
                    <div style={{ fontSize: 12, color: '#333' }}>Marca: {(function(){ const fb=state.brands.find(b=>b.id===p.brandId); return (fb && fb.name) || '—'; })()}</div>
                    <div style={{ color: '#008000', fontWeight: 'bold', marginTop: 4 }}>${p.price}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      <button style={btn()} onClick={() => loadProduct(p.id)}>✎ Editar</button>
                      <button style={btn()} onClick={() => deleteProduct(p.id)}>🗑 Eliminar</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </div>
          </div>
          <div style={{ overflow: 'auto' }}>
            <div style={groupHeader()}>{pId ? 'Editar' : 'Nuevo'} producto</div>
            <div style={groupBody()}>
            <Field label="Nombre"><input value={pName} onChange={e => setPName(e.target.value)} /></Field>
            <Field label="Descripción"><textarea value={pDesc} onChange={e => setPDesc(e.target.value)} /></Field>
            <Field label="Categoría">
              <select value={pCategory} onChange={e => setPCategory(e.target.value)}>
                <option value="general">General</option>
                <option value="otros">Otros</option>
              </select>
            </Field>
            <Field label="Marca">
              <select value={pBrandId} onChange={e => setPBrandId(e.target.value)}>
                <option value="">Seleccione</option>
                {state.brands.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Precio"><input type="number" min="0" value={pPrice} onChange={e => setPPrice(e.target.value)} /></Field>
            <Field label="Imagen URL"><input value={pImage} onChange={e => { setPImage(e.target.value); setPPreview(e.target.value); }} /></Field>
            {pPreview && (
              <div style={{ marginBottom: 8 }}>
                <img alt="preview" src={pPreview} style={{ maxWidth: 200, height: 'auto' }} />
              </div>
            )}
            <div>
              <button style={btn()} disabled={!canSaveProduct} onClick={saveProduct}>{pId ? 'Guardar cambios' : 'Crear producto'}</button>{' '}
              <button style={btn()} onClick={clearProductForm}>Limpiar</button>
            </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'brands' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, flex: 1 }}>
          <div style={{ overflow: 'auto' }}>
            <div style={groupHeader()}>Catálogo de Marcas</div>
            <div style={groupBody()}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
              {state.brands.map(b => (
                <div key={b.id} style={{ border: '1px solid #b0c4ff', background: '#fff', boxShadow: 'inset 0 0 0 1px #dde6ff' }}>
                  <div style={{ height: 100, background: '#f4f4f4', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #ccd6ff' }}>
                    {b.logo ? <img alt={b.name} src={b.logo} style={{ maxWidth: '100%', maxHeight: '100%' }} /> : <span style={{ color: '#888' }}>Sin logo</span>}
                  </div>
                  <div style={{ padding: 8 }}>
                    <div style={{ fontWeight: 'bold', textAlign: 'center' }}>{b.name}</div>
                    <div style={{ fontSize: 12, color: '#333', marginTop: 4 }}>{b.description || '—'}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      <button style={btn()} onClick={() => loadBrand(b.id)}>✎ Editar</button>
                      <button style={btn()} disabled={state.products.some(p => p.brandId === b.id)} onClick={() => deleteBrand(b.id)}>🗑 Eliminar</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </div>
          </div>
          <div style={{ overflow: 'auto' }}>
            <div style={groupHeader()}>{bId ? 'Editar' : 'Nueva'} marca</div>
            <div style={groupBody()}>
            <Field label="Nombre"><input value={bName} onChange={e => setBName(e.target.value)} /></Field>
            <Field label="Descripción"><textarea value={bDesc} onChange={e => setBDesc(e.target.value)} /></Field>
            <Field label="Logo URL"><input value={bLogo} onChange={e => setBLogo(e.target.value)} /></Field>
            {bLogo && (
              <div style={{ marginBottom: 8 }}>
                <img alt="logo" src={bLogo} style={{ maxWidth: 140, height: 'auto' }} />
              </div>
            )}
            <div>
              <button style={btn()} onClick={saveBrand}>{bId ? 'Guardar cambios' : 'Crear marca'}</button>{' '}
              <button style={btn()} onClick={clearBrandForm}>Limpiar</button>
            </div>
            </div>
          </div>
        </div>
      )}
      {/* cierre contenedor columna */}
      </div>
      {/* cierre content wrapper */}
      </div>
      {/* cierre right card */}
      </div>
      {/* cierre right column */}
      </div>
      {/* cierre inner */}
      </div>
      {/* cierre content */}
      </div>

      {/* Barra de estado */}
      <div style={{ marginTop: 8, background: '#e8e4cf', border: '1px solid #b8b4a2', padding: '6px 8px', fontSize: 11 }}>
        Estado: Sistema operativo | Productos: {totalProducts} | Última actualización: {lastUpdate.toLocaleString()}
      </div>
    </Div>
  );
}

// Estilos reutilizables inspirados en XP
function btn() {
  return {
    background: 'linear-gradient(#fefefe,#e7e7e7)',
    border: '1px solid #7aa2e8',
    padding: '4px 8px',
    cursor: 'pointer',
  };
}
function groupHeader() {
  return {
    background: '#efe9d7',
    border: '1px solid #bdb8a6',
    padding: '4px 8px',
    fontWeight: 'bold',
  };
}
function groupBody() {
  return {
    border: '1px solid #bdb8a6',
    borderTop: 'none',
    padding: 8,
    background: '#fff',
    marginBottom: 8,
  };
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
  .com__content__right { height:100%; overflow:auto; background:#fff; flex:1; }
  .com__content__right__card__header { width:300px; font-weight:700; padding: 2px 0 3px 12px; position:relative; }
  .com__content__right__card__header:after { content:''; display:block; background: linear-gradient(to right, #70bfff 0, #fff 100%); position:absolute; bottom:0; left:-12px; height:1px; width:100%; }
  .com__content__right__card__content { display:flex; align-items:flex-start; padding:15px 15px 0; flex-wrap:wrap; }
`;

export default Admin;


