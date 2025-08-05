import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  TextInput,
  TouchableOpacity,
} from "react-native";
import axios from "axios";
import { Picker } from "@react-native-picker/picker";
import { Product, Table, OrderItem } from "../types";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

interface CreateOrderFormProps {
    onOrderCreated: () => void;
}

export default function CreateOrderForm({ onOrderCreated }: CreateOrderFormProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedItems, setSelectedItems] = useState<Partial<OrderItem>[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);

  useEffect(() => {
    axios
      .get(`${API_URL}/products`)
      .then((res) => setProducts(res.data))
      .catch(() => Alert.alert("Error", "Failed to load products."));

    loadAvailableTables();
  }, []);

  const loadAvailableTables = () => {
    axios
      .get(`${API_URL}/tables/available`)
      .then((res) => {
        setTables(res.data);
        if (res.data?.length > 0) {
          setSelectedTableId(res.data[0].id);
        } else {
          setSelectedTableId(null);
        }
      })
      .catch(() => Alert.alert("Error", "Failed to load available tables."));
  };

  const addItem = () => {
    if (products?.length === 0) {
      Alert.alert("Error", "Products not loaded yet.");
      return;
    }
    // Add a new item with the first product as default
    setSelectedItems([...selectedItems, { product_id: products[0].id, quantity: 1 }]);
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const updated = [...selectedItems];
    const itemToUpdate = { ...updated[index] };
    (itemToUpdate as any)[field] = value;
    updated[index] = itemToUpdate;
    setSelectedItems(updated);
  };

  const removeItem = (index: number) => {
    const updated = [...selectedItems];
    updated.splice(index, 1);
    setSelectedItems(updated);
  };

  const handleSubmit = async () => {
    if (!selectedTableId) {
      Alert.alert("Error", "Please select a table.");
      return;
    }
    if (selectedItems.length === 0) {
      Alert.alert("Error", "Please add at least one item to the order.");
      return;
    }

    try {
      const orderDate = new Date().toISOString().split("T")[0];
      
      await axios.post(`${API_URL}/orders`, {
        table_id: selectedTableId,
        items: selectedItems,
        date: orderDate,
      });

        Alert.alert("Success", "Order created successfully!");
        setSelectedItems([]);
        loadAvailableTables();
        onOrderCreated();
    } catch (err: any) {
        const errorMessage = err.response?.data?.error || "Error creating order";
        Alert.alert("Error", errorMessage);
        console.error(err);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
        <Text style={styles.title}>Create New Order</Text>

        <View style={styles.formSection}>
          <Text style={styles.label}>Table:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedTableId}
              onValueChange={(itemValue) => setSelectedTableId(itemValue)}
              enabled={tables.length > 0}
            >
              {tables.map((table) => (
                <Picker.Item key={table.id} label={`${table.name} (Cap: ${table.capacity})`} value={table.id} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.formSection}>
            <View style={styles.itemsHeader}>
                <Text style={styles.label}>Items</Text>
                <Button title="+ Add Product" onPress={addItem} disabled={products.length === 0} />
            </View>

            {selectedItems.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={item.product_id}
                            onValueChange={(value) => updateItem(index, "product_id", value)}
                        >
                            {products.map((p) => (
                                <Picker.Item key={p.id} label={`${p.name} (Stock: ${p.stock})`} value={p.id} />
                            ))}
                        </Picker>
                    </View>
                    <TextInput
                        style={styles.quantityInput}
                        value={String(item.quantity || 1)}
                        onChangeText={(text) => updateItem(index, "quantity", parseInt(text) || 1)}
                        keyboardType="number-pad"
                    />
                    <TouchableOpacity onPress={() => removeItem(index)} style={styles.removeButton}>
                        <Text style={styles.removeButtonText}>X</Text>
                    </TouchableOpacity>
                </View>
            ))}
        </View>

        <Button
          title="Create Order"
          onPress={handleSubmit}
          disabled={!selectedTableId || selectedItems.length === 0}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: '#f0f2f5',
    },
    container: {
      padding: 15,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 20,
      textAlign: 'center',
    },
    formSection: {
        marginBottom: 25,
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
    },
    label: {
        fontSize: 18,
        fontWeight: '500',
        marginBottom: 10,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        flex: 1,
    },
    itemsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 10,
    },
    quantityInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        paddingHorizontal: 10,
        paddingVertical: 12,
        width: 60,
        textAlign: 'center',
    },
    removeButton: {
        backgroundColor: '#dc3545',
        padding: 10,
        borderRadius: 20,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    }
  });