import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  fetchPropertiesFromSupabase, 
  insertPropertyToSupabase, 
  updatePropertyInSupabase, 
  deletePropertyFromSupabase, 
  subscribeToPropertiesRealtime,
  fetchPropertyByIdFromSupabase
} from '../services/propertyService';
import { INITIAL_PROPERTIES } from '../data/initialProperties';
import { useAuth } from './AuthContext';

const PropertyContext = createContext();

const STORAGE_FAVORITES_KEY = 'indstate_favorites_v1';
const STORAGE_COMPARE_KEY = 'indstate_compare_v1';
const STORAGE_SAVED_SEARCHES_KEY = 'indstate_saved_searches_v1';
const STORAGE_INQUIRIES_KEY = 'indstate_inquiries_v1';

export function PropertyProvider({ children }) {
  const { user } = useAuth();

  // 1. Properties State
  const [properties, setProperties] = useState(INITIAL_PROPERTIES);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // 2. Favorites State
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_FAVORITES_KEY);
      return saved ? JSON.parse(saved) : ["IND-MH-MUM-01", "IND-KA-BLR-02"];
    } catch {
      return [];
    }
  });

  // 3. Compare List (up to 4 properties)
  const [compareList, setCompareList] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_COMPARE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 4. Quick Preview Lightbox Modal
  const [quickPreviewProperty, setQuickPreviewProperty] = useState(null);

  // 5. Inquiries & Site Visits
  const [inquiries, setInquiries] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_INQUIRIES_KEY);
      return saved ? JSON.parse(saved) : [
        {
          id: "inq-101",
          propertyId: "IND-MH-MUM-01",
          propertyTitle: "Lodha World View - Ultra Luxury Sea-Facing Residence",
          clientName: "Vikram Sengupta",
          clientPhone: "+91 98200 11223",
          preferredDate: "2026-09-28",
          timeSlot: "11:00 AM - 01:00 PM",
          status: "Confirmed",
          createdAt: "2026-09-20"
        }
      ];
    } catch {
      return [];
    }
  });

  // 6. Saved Searches
  const [savedSearches, setSavedSearches] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SAVED_SEARCHES_KEY);
      return saved ? JSON.parse(saved) : [
        { id: "ss-1", title: "2-3 BHK Flats in Pune under ₹1.5 Cr", query: "state=Maharashtra&city=Pune&bhk=2,3&maxPrice=15000000" },
        { id: "ss-2", title: "Luxury Villas in Bengaluru Whitefield", query: "state=Karnataka&city=Bengaluru&type=Independent Villa" }
      ];
    } catch {
      return [];
    }
  });

  // Load properties initially from Supabase
  const loadInitialProperties = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await fetchPropertiesFromSupabase();
      if (Array.isArray(data) && data.length > 0) {
        setProperties(data);
      }
    } catch (err) {
      console.warn('[PropertyContext] Error loading properties:', err);
      setFetchError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize data and setup Realtime subscription
  useEffect(() => {
    loadInitialProperties();

    // Setup Supabase Realtime subscription
    // Listens for INSERT, UPDATE, DELETE on 'properties' table across all connected browsers
    const unsubscribe = subscribeToPropertiesRealtime({
      onInsert: (newProperty) => {
        setProperties(prev => {
          // Avoid duplicate inserts
          if (prev.some(p => String(p.id) === String(newProperty.id))) {
            return prev;
          }
          return [newProperty, ...prev];
        });
      },
      onUpdate: (updatedProperty) => {
        setProperties(prev => 
          prev.map(p => String(p.id) === String(updatedProperty.id) ? updatedProperty : p)
        );
      },
      onDelete: (deletedId) => {
        setProperties(prev => 
          prev.filter(p => String(p.id) !== String(deletedId))
        );
      }
    });

    return () => {
      unsubscribe();
    };
  }, [loadInitialProperties]);

  // Sync state helpers with localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem(STORAGE_COMPARE_KEY, JSON.stringify(compareList));
  }, [compareList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_INQUIRIES_KEY, JSON.stringify(inquiries));
  }, [inquiries]);

  useEffect(() => {
    localStorage.setItem(STORAGE_SAVED_SEARCHES_KEY, JSON.stringify(savedSearches));
  }, [savedSearches]);

  // Actions
  const toggleFavorite = (propertyId) => {
    setFavorites(prev => {
      if (prev.includes(propertyId)) {
        return prev.filter(id => id !== propertyId);
      } else {
        return [...prev, propertyId];
      }
    });
  };

  const isFavorite = (propertyId) => favorites.includes(propertyId);

  const addToCompare = (property) => {
    if (compareList.some(p => p.id === property.id)) {
      removeFromCompare(property.id);
      return;
    }
    if (compareList.length >= 4) {
      alert("You can compare a maximum of 4 properties side by side.");
      return;
    }
    setCompareList(prev => [...prev, property]);
  };

  const removeFromCompare = (propertyId) => {
    setCompareList(prev => prev.filter(p => p.id !== propertyId));
  };

  const clearCompare = () => {
    setCompareList([]);
  };

  const isInCompare = (propertyId) => compareList.some(p => p.id === propertyId);

  /**
   * Save property permanently to Supabase backend
   */
  const addProperty = async (newPropData) => {
    try {
      const created = await insertPropertyToSupabase(newPropData, user);
      // Immediately reflect in state if realtime event takes milliseconds
      setProperties(prev => {
        if (prev.some(p => String(p.id) === String(created.id))) {
          return prev;
        }
        return [created, ...prev];
      });
      return created;
    } catch (err) {
      console.error('[PropertyContext] Error creating property:', err);
      throw err;
    }
  };

  /**
   * Update property in Supabase backend
   */
  const updateProperty = async (id, updatedFields) => {
    try {
      // Optimistic update
      setProperties(prev => prev.map(p => String(p.id) === String(id) ? { ...p, ...updatedFields } : p));
      await updatePropertyInSupabase(id, updatedFields);
    } catch (err) {
      console.error('[PropertyContext] Error updating property:', err);
      // Revert/refresh on error
      loadInitialProperties();
      throw err;
    }
  };

  /**
   * Delete property permanently from Supabase backend
   */
  const deleteProperty = async (id) => {
    try {
      // Optimistic removal
      setProperties(prev => prev.filter(p => String(p.id) !== String(id)));
      await deletePropertyFromSupabase(id);
    } catch (err) {
      console.error('[PropertyContext] Error deleting property:', err);
      // Revert/refresh on error
      loadInitialProperties();
      throw err;
    }
  };

  /**
   * Query database properties with specific filters (e.g. State, City, Type)
   */
  const fetchByFilter = async (filters) => {
    setIsLoading(true);
    try {
      const filtered = await fetchPropertiesFromSupabase(filters);
      return filtered;
    } catch (err) {
      console.error('[PropertyContext] Filter error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetch single property by ID
   */
  const getPropertyById = async (id) => {
    const existing = properties.find(p => String(p.id) === String(id));
    if (existing) return existing;
    return await fetchPropertyByIdFromSupabase(id);
  };

  const submitInquiry = (inquiryData) => {
    const newInquiry = {
      id: `inq-${Date.now().toString().slice(-5)}`,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'Pending Callback',
      ...inquiryData
    };
    setInquiries(prev => [newInquiry, ...prev]);
    return newInquiry;
  };

  const saveSearch = (searchData) => {
    const newSearch = {
      id: `ss-${Date.now().toString().slice(-5)}`,
      ...searchData
    };
    setSavedSearches(prev => [newSearch, ...prev]);
    return newSearch;
  };

  const deleteSavedSearch = (id) => {
    setSavedSearches(prev => prev.filter(s => s.id !== id));
  };

  return (
    <PropertyContext.Provider
      value={{
        properties,
        isLoading,
        fetchError,
        reloadProperties: loadInitialProperties,
        favorites,
        toggleFavorite,
        isFavorite,
        compareList,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
        quickPreviewProperty,
        setQuickPreviewProperty,
        addProperty,
        updateProperty,
        deleteProperty,
        fetchByFilter,
        getPropertyById,
        inquiries,
        submitInquiry,
        savedSearches,
        saveSearch,
        deleteSavedSearch
      }}
    >
      {children}
    </PropertyContext.Provider>
  );
}

export function useProperty() {
  const context = useContext(PropertyContext);
  if (!context) {
    throw new Error('useProperty must be used within a PropertyProvider');
  }
  return context;
}
