import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, deleteUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    const googleProvider = new GoogleAuthProvider();
    // Optional: force account selection every time
    googleProvider.setCustomParameters({ prompt: 'select_account' });

    async function loginWithGoogle() {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // Check domain
        if (!user.email.endsWith('@suzuval.cl')) {
            await deleteUser(user).catch(console.error); // try to clean up auth user if created
            await logout();
            throw new Error("Acceso denegado. Solo se permiten correos @suzuval.cl.");
        }

        // Check if user exists in Firestore
        const docRef = doc(db, 'usuarios', user.uid);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            const isAdmin = user.email.toLowerCase() === 'gestionyautomatizacion@suzuval.cl';
            // First time login
            const newUserData = {
                nombre: user.displayName || user.email.split('@')[0],
                email: user.email,
                rol: isAdmin ? 'Supervisor' : 'Vendedor',
                sucursal: isAdmin ? 'Todas' : '',
                fecha_creacion: new Date()
            };
            await setDoc(docRef, newUserData);
            setUserData(newUserData);
        } else {
            const data = docSnap.data();
            // Force admin role and global sucursal if it's the master account
            if (user.email.toLowerCase() === 'gestionyautomatizacion@suzuval.cl') {
                if (data.rol !== 'Supervisor' || data.sucursal !== 'Todas') {
                    data.rol = 'Supervisor';
                    data.sucursal = 'Todas';
                    await setDoc(docRef, data, { merge: true });
                }
            }
            setUserData(data);
        }

        setCurrentUser(user);
        return result;
    }

    function logout() {
        return signOut(auth);
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setLoading(true);
            }
            setCurrentUser(user);
            if (user) {
                try {
                    const docRef = doc(db, 'usuarios', user.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setUserData(docSnap.data());
                    } else {
                        setUserData(null);
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                    setUserData(null);
                }
            } else {
                setUserData(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userData,
        loading,
        loginWithGoogle,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
