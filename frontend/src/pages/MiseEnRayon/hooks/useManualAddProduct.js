import { useState } from "react";
import { db } from "../../../config/firebase.js";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../../context/AuthContext.jsx";

export function useManualAddProduct(onSuccess) {
  const { user, profile } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    category: "maraichage",
    unit: "kg",
    description: "",
    imageUrl: "",
    priceHT: "",
    vatRate: 5.5,
    stockQuantity: "",
    batchNumber: `L-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    dlc: "",
    storageTemp: "10°C - 15°C",
    egalimBadge: "Aucun"
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "category" ? { vatRate: value === "artisanat" ? 20 : 5.5 } : {})
    }));
  };

  const priceHTNum = Number(formData.priceHT) || 0;
  const vatRateNum = Number(formData.vatRate) || 5.5;
  const commissionHT = priceHTNum * 0.12;
  const netProducerHT = priceHTNum * 0.88;
  const vatAmount = priceHTNum * (vatRateNum / 100);
  const priceTTC = priceHTNum + vatAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!formData.name.trim()) {
      setErrorMsg("Le nom du produit est obligatoire.");
      return;
    }
    if (priceHTNum <= 0) {
      setErrorMsg("Le prix HT doit être supérieur à 0.");
      return;
    }

    setIsSubmitting(true);

    try {
      const newProduct = {
        name: formData.name.trim(),
        title: formData.name.trim(),
        category: formData.category,
        unit: formData.unit,
        description: formData.description.trim(),
        imageUrl: formData.imageUrl.trim() || "/placeholder.png",
        priceHT: priceHTNum,
        vatRate: vatRateNum,
        priceTTC,
        stockQuantity: Number(formData.stockQuantity) || 0,
        batchNumber: formData.batchNumber.trim() || `L-${Date.now()}`,
        dlc: formData.dlc || null,
        storageTemp: formData.storageTemp,
        egalimBadge: formData.egalimBadge !== "Aucun" ? formData.egalimBadge : null,
        producerId: user?.uid || "producteur_inconnu",
        producerName: profile?.companyName || user?.displayName || "Producteur Partenaire",
        producerSiret: profile?.siret || "-",
        stripeAccountId: profile?.stripeAccountId || null,
        status: "ACTIF",
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, "products"), newProduct);

      setSuccessMsg("Produit ajouté au catalogue avec succès !");
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Erreur lors de la création du produit :", err);
      setErrorMsg(err.message || "Impossible d'enregistrer le produit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    setFormData,
    handleChange,
    handleSubmit,
    isSubmitting,
    errorMsg,
    successMsg,
    calculatedPrices: {
      priceHTNum,
      commissionHT,
      netProducerHT,
      vatAmount,
      priceTTC
    }
  };
}

export default useManualAddProduct;