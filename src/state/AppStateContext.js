import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { getSupabaseClient } from 'lib/supabaseClient';

const PERSIST_KEY = 'app.state.v1';

const initialData = {
  session: null,
  user: null,
  products: [],
  brands: [],
  // filtros de catálogo
  catalog: {
    query: '',
    category: 'all',
    brandId: 'all',
    minPrice: 0,
    maxPrice: 0,
  },
};

const ACTIONS = {
  SET_SESSION: 'SET_SESSION',
  SET_USER: 'SET_USER',
  UPSERT_PRODUCT: 'UPSERT_PRODUCT',
  DELETE_PRODUCT: 'DELETE_PRODUCT',
  UPSERT_BRAND: 'UPSERT_BRAND',
  DELETE_BRAND: 'DELETE_BRAND',
  SET_CATALOG_FILTERS: 'SET_CATALOG_FILTERS',
  SET_PRODUCTS: 'SET_PRODUCTS',
  SET_BRANDS: 'SET_BRANDS',
  HYDRATE: 'HYDRATE',
};

function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.HYDRATE:
      return { ...state, ...action.payload };
    case ACTIONS.SET_SESSION:
      return { ...state, session: action.payload.session, user: action.payload.user || null };
    case ACTIONS.SET_USER:
      return { ...state, user: action.payload };
    case ACTIONS.UPSERT_PRODUCT: {
      const p = action.payload;
      const exists = state.products.some(x => x.id === p.id);
      return {
        ...state,
        products: exists
          ? state.products.map(x => (x.id === p.id ? { ...x, ...p } : x))
          : [...state.products, { ...p, id: p.id || `prd_${Date.now()}` }],
      };
    }
    case ACTIONS.DELETE_PRODUCT:
      return { ...state, products: state.products.filter(x => x.id !== action.payload) };
    case ACTIONS.SET_PRODUCTS:
      return { ...state, products: Array.isArray(action.payload) ? action.payload : [] };
    case ACTIONS.UPSERT_BRAND: {
      const b = action.payload;
      const exists = state.brands.some(x => x.id === b.id || x.name.toLowerCase() === b.name.toLowerCase());
      if (b.id) {
        return { ...state, brands: state.brands.map(x => (x.id === b.id ? { ...x, ...b } : x)) };
      }
      if (exists) {
        return state;
      }
      return { ...state, brands: [...state.brands, { ...b, id: `br_${Date.now()}` }] };
    }
    case ACTIONS.DELETE_BRAND: {
      const brandId = action.payload;
      const hasProducts = state.products.some(p => p.brandId === brandId);
      if (hasProducts) return state;
      return { ...state, brands: state.brands.filter(x => x.id !== brandId) };
    }
    case ACTIONS.SET_BRANDS:
      return { ...state, brands: Array.isArray(action.payload) ? action.payload : [] };
    case ACTIONS.SET_CATALOG_FILTERS:
      return { ...state, catalog: { ...state.catalog, ...action.payload } };
    default:
      return state;
  }
}

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [state, dispatch] = useReducer(reducer, initialData);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PERSIST_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // No hidratamos user/session para exigir login real
        const { products, brands, catalog } = parsed || {};
        dispatch({ type: ACTIONS.HYDRATE, payload: { products: products || [], brands: brands || [], catalog: catalog || initialData.catalog } });
      }
    } catch (_e) {}
    supabase.auth.getSession().then(async ({ data }) => {
      if (data && data.session && data.session.user) {
        const baseUser = data.session.user;
        let role = (baseUser.user_metadata && baseUser.user_metadata.role) || baseUser.role || '';
        try {
          // Si usas tabla 'profiles' con RLS (select propio), lee por uid
          if (!role && supabase && supabase.from && baseUser.id) {
            const { data: prof } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', baseUser.id)
              .maybeSingle();
            if (prof && prof.role) role = prof.role;
          }
        } catch (_e) {}
        const mergedUser = role ? { ...baseUser, role } : baseUser;
        dispatch({ type: ACTIONS.SET_SESSION, payload: { session: data.session, user: mergedUser } });
      }
    });
    // Cargar datos iniciales desde Supabase si existen
    (async () => {
      try {
        if (supabase && supabase.from) {
          const { data: brands, error: bErr } = await supabase.from('brands').select('*');
          if (!bErr && Array.isArray(brands)) {
            const mapped = brands.map(b => ({ id: b.id || `br_${b.name}` , name: b.name, description: b.description || '', logo: b.logo || '' }));
            dispatch({ type: ACTIONS.SET_BRANDS, payload: mapped });
          }
          const { data: products, error: pErr } = await supabase.from('products').select('*');
          if (!pErr && Array.isArray(products)) {
            const mapped = products.map(p => ({ id: p.id || `prd_${p.name}`, name: p.name, description: p.description || '', category: p.category || 'general', brandId: p.brand_id || p.brandId || '', price: Number(p.price || 0), image: p.image || '' }));
            dispatch({ type: ACTIONS.SET_PRODUCTS, payload: mapped });
          }
        }
      } catch (_e) {}
    })();
  }, [supabase]);

  useEffect(() => {
    // Persistimos solo datos de catálogo; nunca la sesión
    const toPersist = { products: state.products, brands: state.brands, catalog: state.catalog };
    try {
      localStorage.setItem(PERSIST_KEY, JSON.stringify(toPersist));
    } catch (_e) {}
  }, [state.products, state.brands, state.catalog]);

  const api = useMemo(() => ({ supabase, state, dispatch, ACTIONS }), [supabase, state]);

  return <AppStateContext.Provider value={api}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState debe usarse dentro de AppStateProvider');
  return ctx;
}

export default AppStateContext;


