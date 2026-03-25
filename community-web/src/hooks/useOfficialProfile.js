import { useOfficialProfileContext } from '../contexts/OfficialProfileContext';

export function useOfficialProfile() {
  const { profile, loading } = useOfficialProfileContext();

  return {
    barangay:     profile?.barangay      || '',
    barangayName: profile?.barangay_name || '',
    avatarUrl:    profile?.avatar_url    || null,
    position:     profile?.position      || '',
    isCapitan:    profile?.position === 'Barangay Captain',
    canManage:    profile?.can_manage    === true,
    loading,
  };
}
