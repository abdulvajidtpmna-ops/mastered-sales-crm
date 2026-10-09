import React, { useState } from 'react';
import { Phone, MessageSquare, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface CallButtonProps {
  phone: string;
  name?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CallButton: React.FC<CallButtonProps> = ({
  phone,
  name,
  className = '',
  size = 'md',
}) => {
  const cleanPhone = (phone || '').replace(/[^0-9+]/g, '');

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-xs font-medium gap-1.5',
    lg: 'px-4 py-2.5 text-sm font-semibold gap-2',
  };

  return (
    <a
      href={`tel:${cleanPhone}`}
      aria-label={`Call ${name || 'Lead'}`}
      className={`inline-flex items-center justify-center rounded-md bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors active:scale-95 ${sizeClasses[size]} ${className}`}
      onClick={(e) => {
        if (!cleanPhone) {
          e.preventDefault();
          alert('Phone number is missing.');
        }
      }}
    >
      <Phone className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>Call</span>
    </a>
  );
};

interface WhatsAppButtonProps {
  leadId?: string;
  phone: string;
  name?: string;
  templateId?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  onOpened?: () => void;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  leadId,
  phone,
  name,
  templateId,
  className = '',
  size = 'md',
  onOpened,
}) => {
  const [loading, setLoading] = useState(false);
  const { error, success } = useToast();

  const handleWhatsApp = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!phone) {
      error('WhatsApp number is not available.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.openWhatsApp({
        leadId,
        phone,
        messageTemplateId: templateId,
      });

      if (res.success && res.data?.url) {
        // Open the returned URL in a new window/tab
        window.open(res.data.url, '_blank', 'noopener,noreferrer');
        success(`Opened WhatsApp for ${name || 'Lead'}`);
        if (onOpened) onOpened();
      } else {
        // Fallback to wa.me if backend message indicates standard url
        const cleanNumber = phone.replace(/[^0-9]/g, '');
        const fallbackUrl = `https://wa.me/${cleanNumber}`;
        window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
        if (res.message) {
          error(res.message);
        }
      }
    } catch (err: any) {
      error(err.message || 'Failed to open WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-xs font-medium gap-1.5',
    lg: 'px-4 py-2.5 text-sm font-semibold gap-2',
  };

  return (
    <button
      type="button"
      onClick={handleWhatsApp}
      disabled={loading}
      aria-label={`Open WhatsApp for ${name || 'Lead'}`}
      className={`inline-flex items-center justify-center rounded-md bg-[#25D366] hover:bg-[#20ba5a] text-white shadow-xs transition-colors active:scale-95 disabled:opacity-50 cursor-pointer ${sizeClasses[size]} ${className}`}
    >
      {loading ? (
        <Loader2 className={`animate-spin ${size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
      ) : (
        <MessageSquare className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      )}
      <span>WhatsApp</span>
    </button>
  );
};
