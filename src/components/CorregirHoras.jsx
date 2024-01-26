// import React, { useState, useEffect } from 'react';
// import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

// const CorregirHoras = () => {
//     const [actualizando, setActualizando] = useState(false);

//     const corregirFechas = async () => {
//         try {
//             setActualizando(true);

//             const db = getFirestore();
//             const horasCollectionRef = collection(db, 'horas');

//             // Crear una consulta para obtener documentos con 'fechaCreacion' igual a '2024-01-25'
//             const q = query(horasCollectionRef, where('fechaCreacion', '==', '2024-01-25'));
//             const querySnapshot = await getDocs(q);

//             // Iterar sobre los documentos y actualizar el campo 'fechaFicha'
//             querySnapshot.forEach(async (doc) => {
//                 const newFechaFicha = doc.data().fechaFicha.replace('2024', '2023');

//                 // Utilizar la referencia al documento directamente
//                 await updateDoc(doc.ref, { fechaFicha: newFechaFicha });
//             });

//             console.log('Fechas corregidas correctamente.');
//         } catch (error) {
//             console.error('Error al corregir fechas:', error);
//         } finally {
//             setActualizando(false);
//         }
//     };

//     useEffect(() => {
//         // Ejecutar la función de corrección cuando el componente se monta
//         corregirFechas();
//     }, []);

//     return (
//         <div>
//             {actualizando ? (
//                 <p>Corrigiendo fechas...</p>
//             ) : (
//                 <p>Proceso de corrección completado.</p>
//             )}
//         </div>
//     );
// };

// export default CorregirHoras;