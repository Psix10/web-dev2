import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function ProtectedRoute({ children }) {
    const { admin, loading } = useAdminAuth();

    if (loading) {
        return (
        <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: '100vh' 
        }}>
            Загрузка...
        </div>
        );
    }

    if (!admin) {
        return <Navigate to="/admin/login" replace />;
    }

    return children;
}