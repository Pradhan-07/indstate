import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';
import { INITIAL_PROPERTIES } from '../data/initialProperties.js';

/**
 * Maps Supabase PostgreSQL properties table row (snake_case)
 * to INDSTATE unified frontend property object (supporting both camelCase & snake_case)
 */
export function mapDatabaseProperty(row) {
  if (!row) return null;

  const priceNum = Number(row.price) || 0;
  const areaNum = Number(row.area) || 0;
  const calculatedSqft = areaNum > 0 ? Math.round(priceNum / areaNum) : 0;

  return {
    id: String(row.id),
    owner_id: row.owner_id,
    ownerId: row.owner_id,
    title: row.title || 'Untitled Property',
    description: row.description || '',
    purpose: row.listing_type || 'Buy',
    listing_type: row.listing_type || 'Buy',
    propertyType: row.property_type || 'Apartment',
    property_type: row.property_type || 'Apartment',
    price: priceNum,
    pricePerSqFt: Number(row.price_per_sqft) || calculatedSqft,
    price_per_sqft: Number(row.price_per_sqft) || calculatedSqft,
    maintenanceCharges: Number(row.maintenance_charges) || 0,
    maintenance_charges: Number(row.maintenance_charges) || 0,
    state: row.state || '',
    city: row.city || '',
    locality: row.locality || '',
    district: row.district || '',
    pinCode: row.pin_code || '',
    pin_code: row.pin_code || '',
    address: row.address || '',
    bhk: Number(row.bedrooms) || 0,
    bedrooms: Number(row.bedrooms) || 0,
    bathrooms: Number(row.bathrooms) || 0,
    balconies: Number(row.balconies) || 0,
    carpetArea: areaNum,
    area: areaNum,
    superBuiltUpArea: Number(row.super_built_up_area) || Math.round(areaNum * 1.3),
    super_built_up_area: Number(row.super_built_up_area) || Math.round(areaNum * 1.3),
    facing: row.facing || 'East (Vastu Compliant)',
    furnishing: row.furnishing || 'Semi-Furnished',
    possessionStatus: row.possession_status || 'Ready to Move',
    possession_status: row.possession_status || 'Ready to Move',
    possessionDate: row.possession_date || 'Immediate',
    possession_date: row.possession_date || 'Immediate',
    floor: row.floor || '',
    parking: row.parking || '',
    reraNumber: row.rera_number || '',
    rera_number: row.rera_number || '',
    isReraVerified: Boolean(row.is_rera_verified || (row.rera_number && row.rera_number.length > 4)),
    is_rera_verified: Boolean(row.is_rera_verified || (row.rera_number && row.rera_number.length > 4)),
    coordinates: (row.latitude && row.longitude) ? [Number(row.latitude), Number(row.longitude)] : [19.0760, 72.8777],
    latitude: row.latitude,
    longitude: row.longitude,
    images: Array.isArray(row.images) && row.images.length > 0 
      ? row.images 
      : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'],
    amenities: Array.isArray(row.amenities) ? row.amenities : [],
    floorPlans: Array.isArray(row.floor_plans) ? row.floor_plans : [],
    floor_plans: Array.isArray(row.floor_plans) ? row.floor_plans : [],
    nearby: Array.isArray(row.nearby) ? row.nearby : [],
    agent: row.agent && typeof row.agent === 'object' && Object.keys(row.agent).length > 0
      ? row.agent
      : {
          name: row.contact_name || 'INDSTATE Verified Owner',
          phone: row.contact_phone || '+91 98765 43210',
          whatsapp: row.contact_phone ? row.contact_phone.replace(/\D/g, '') : '919876543210',
          agency: row.contact_role === 'Owner' ? 'Direct Owner (0% Brokerage)' : 'Certified Channel Partner',
          rating: 4.8,
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(row.contact_name || 'Owner')}&backgroundColor=0F1B3D&textColor=FFFFFF`
        },
    status: row.status || 'approved',
    featured: Boolean(row.featured),
    createdAt: row.created_at || new Date().toISOString(),
    created_at: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString()
  };
}

/**
 * Fetch all properties from Supabase PostgreSQL, ordered newest first
 */
export async function fetchPropertiesFromSupabase(filters = {}) {
  if (!isSupabaseConfigured()) {
    return filterInitialProperties(INITIAL_PROPERTIES, filters);
  }

  try {
    let query = supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    // Database-level state filter
    if (filters.state && filters.state.trim()) {
      query = query.eq('state', filters.state.trim());
    }

    // Database-level city filter
    if (filters.city && filters.city.trim()) {
      query = query.ilike('city', `%${filters.city.trim()}%`);
    }

    // Database-level listing type / purpose
    if (filters.purpose && filters.purpose.trim() && filters.purpose !== 'All') {
      query = query.eq('listing_type', filters.purpose.trim());
    }

    // Database-level property type
    if (filters.type && filters.type.trim()) {
      query = query.eq('property_type', filters.type.trim());
    }

    // Database-level BHK
    if (filters.bhk && !isNaN(Number(filters.bhk))) {
      query = query.eq('bedrooms', Number(filters.bhk));
    }

    // Database-level Max Price
    if (filters.maxPrice && Number(filters.maxPrice) < 500000000) {
      query = query.lte('price', Number(filters.maxPrice));
    }

    // Owner specific query for Dashboard
    if (filters.ownerId) {
      query = query.eq('owner_id', filters.ownerId);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('[propertyService] Supabase fetch warning:', error.message);
      return filterInitialProperties(INITIAL_PROPERTIES, filters);
    }

    if (Array.isArray(data) && data.length > 0) {
      return data.map(mapDatabaseProperty);
    }

    // If database returned 0 rows and no specific filter is active, merge initial catalog
    if (!filters.state && !filters.city && !filters.ownerId) {
      return INITIAL_PROPERTIES;
    }

    return [];
  } catch (err) {
    console.warn('[propertyService] Network error fetching properties:', err);
    return filterInitialProperties(INITIAL_PROPERTIES, filters);
  }
}

/**
 * Helper to filter initial properties fallback
 */
function filterInitialProperties(list, filters = {}) {
  if (!filters) return list;
  return list.filter(p => {
    if (filters.state && p.state !== filters.state) return false;
    if (filters.city && p.city.toLowerCase() !== filters.city.toLowerCase()) return false;
    if (filters.purpose && filters.purpose !== 'All' && p.purpose !== filters.purpose) return false;
    if (filters.type && p.propertyType !== filters.type) return false;
    if (filters.bhk && p.bhk !== Number(filters.bhk)) return false;
    if (filters.maxPrice && p.price > Number(filters.maxPrice)) return false;
    return true;
  });
}

/**
 * Fetch a single property by its ID from Supabase
 */
export async function fetchPropertyByIdFromSupabase(id) {
  if (!id) return null;

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        return mapDatabaseProperty(data);
      }
    } catch {
      // Fallback below
    }
  }

  // Fallback to static properties catalog
  return INITIAL_PROPERTIES.find(p => p.id === id) || null;
}

/**
 * Upload a property photo to Supabase Storage bucket 'property-images'
 * Generates an accessible permanent public URL
 */
export async function uploadPropertyPhotoToStorage(file, userId) {
  if (!file) throw new Error('No file provided for upload.');

  if (!isSupabaseConfigured()) {
    // If Supabase is not configured, create a temporary preview URL
    return URL.createObjectURL(file);
  }

  const cleanUserId = userId || 'anonymous';
  const fileExt = file.name.split('.').pop() || 'jpg';
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `${cleanUserId}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${sanitizedName}`;

  // 1. Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('property-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (uploadError) {
    throw new Error(`Failed to upload image: ${uploadError.message}`);
  }

  // 2. Generate permanent public URL
  const { data: publicUrlData } = supabase.storage
    .from('property-images')
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

/**
 * Insert a new property into the Supabase database
 * Validates compulsory fields and associates with authenticated user (owner_id)
 */
export async function insertPropertyToSupabase(propData, authUser) {
  if (!authUser || !authUser.id) {
    throw new Error('Authentication required. Please sign in to post a property.');
  }

  if (!propData.state || !propData.state.trim()) {
    throw new Error('State is mandatory. Please select an Indian State or Union Territory.');
  }

  if (!propData.city || !propData.city.trim()) {
    throw new Error('City is mandatory. Please specify the city.');
  }

  if (!propData.title || !propData.title.trim()) {
    throw new Error('Property title is required.');
  }

  const priceNum = Number(propData.price);
  if (isNaN(priceNum) || priceNum <= 0) {
    throw new Error('Please enter a valid property price in Indian Rupees (₹).');
  }

  const carpetNum = Number(propData.carpetArea) || Number(propData.area) || 500;
  const pricePerSqFt = propData.pricePerSqFt || Math.round(priceNum / carpetNum);

  const imagesArray = Array.isArray(propData.images) && propData.images.length > 0
    ? propData.images
    : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'];

  // Prepare database record payload
  const payload = {
    owner_id: authUser.id,
    title: propData.title.trim(),
    description: propData.description?.trim() || '',
    property_type: propData.propertyType || propData.property_type || 'Apartment',
    listing_type: propData.purpose || propData.listing_type || 'Buy',
    price: priceNum,
    price_per_sqft: pricePerSqFt,
    maintenance_charges: Number(propData.maintenanceCharges) || 0,
    state: propData.state.trim(),
    city: propData.city.trim(),
    locality: propData.locality?.trim() || '',
    district: propData.district?.trim() || '',
    pin_code: propData.pinCode?.trim() || '',
    address: propData.address?.trim() || '',
    bedrooms: Number(propData.bhk) || Number(propData.bedrooms) || 0,
    bathrooms: Number(propData.bathrooms) || 1,
    balconies: Number(propData.balconies) || 0,
    area: carpetNum,
    super_built_up_area: Number(propData.superBuiltUpArea) || Math.round(carpetNum * 1.3),
    furnishing: propData.furnishing || 'Semi-Furnished',
    facing: propData.facing || 'East (Vastu Compliant)',
    possession_status: propData.possessionStatus || 'Ready to Move',
    possession_date: propData.possessionDate || 'Immediate',
    floor: propData.floor || '',
    parking: propData.parking || '',
    rera_number: propData.reraNumber?.trim() || '',
    is_rera_verified: Boolean(propData.isReraVerified || (propData.reraNumber && propData.reraNumber.trim().length > 4)),
    latitude: propData.coordinates?.[0] || 19.0760,
    longitude: propData.coordinates?.[1] || 72.8777,
    images: imagesArray,
    amenities: Array.isArray(propData.amenities) ? propData.amenities : [],
    floor_plans: Array.isArray(propData.floorPlans) ? propData.floorPlans : [],
    nearby: Array.isArray(propData.nearby) ? propData.nearby : [],
    agent: propData.agent || {
      name: propData.contactName || authUser.name || 'INDSTATE Verified Owner',
      phone: propData.contactPhone ? `+91 ${propData.contactPhone}` : (authUser.phone || '+91 98765 43210'),
      whatsapp: propData.contactPhone ? `91${propData.contactPhone.replace(/\D/g, '')}` : '919876543210',
      agency: propData.contactRole === 'Owner' ? 'Direct Owner (0% Brokerage)' : 'Certified Channel Partner',
      rating: 4.9,
      avatar: authUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(propData.contactName || 'Owner')}&backgroundColor=0F1B3D&textColor=FFFFFF`
    },
    status: 'approved', // Immediately visible to all users
    featured: Boolean(propData.featured)
  };

  if (!isSupabaseConfigured()) {
    // Return formatted local property if DB not yet configured
    const localId = `IND-${payload.state.substring(0, 2).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    return mapDatabaseProperty({
      ...payload,
      id: localId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  const { data, error } = await supabase
    .from('properties')
    .insert([payload])
    .select()
    .single();

  if (error) {
    throw new Error(`Database error saving property: ${error.message}`);
  }

  return mapDatabaseProperty(data);
}

/**
 * Update an existing property in Supabase (Owner only enforced by RLS)
 */
export async function updatePropertyInSupabase(id, updates) {
  if (!isSupabaseConfigured()) return;

  const dbUpdates = {
    updated_at: new Date().toISOString()
  };

  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.price !== undefined) dbUpdates.price = Number(updates.price);
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.isReraVerified !== undefined) dbUpdates.is_rera_verified = updates.isReraVerified;
  if (updates.images !== undefined) dbUpdates.images = updates.images;
  if (updates.amenities !== undefined) dbUpdates.amenities = updates.amenities;

  const { data, error } = await supabase
    .from('properties')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update property: ${error.message}`);
  }

  return mapDatabaseProperty(data);
}

/**
 * Delete a property from Supabase (Owner only enforced by RLS)
 */
export async function deletePropertyFromSupabase(id) {
  if (!isSupabaseConfigured()) return true;

  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete property: ${error.message}`);
  }

  return true;
}

/**
 * Subscribe to Supabase Realtime broadcast events (INSERT, UPDATE, DELETE)
 * on the properties table.
 * Users receive new listings, updates, and deletes WITHOUT page refresh.
 */
export function subscribeToPropertiesRealtime({ onInsert, onUpdate, onDelete }) {
  if (!isSupabaseConfigured()) {
    return () => {};
  }

  const channel = supabase
    .channel('indstate-properties-realtime')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'properties'
      },
      (payload) => {
        if (payload.eventType === 'INSERT' && payload.new) {
          const mapped = mapDatabaseProperty(payload.new);
          if (onInsert) onInsert(mapped);
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          const mapped = mapDatabaseProperty(payload.new);
          if (onUpdate) onUpdate(mapped);
        } else if (payload.eventType === 'DELETE' && payload.old) {
          const deletedId = String(payload.old.id);
          if (onDelete) onDelete(deletedId);
        }
      }
    )
    .subscribe((status) => {
      // Realtime subscription status tracked
      if (status === 'SUBSCRIBED') {
        // Connected to realtime
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}
