import "@/global.css";
import { FontAwesome6 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
	Alert,
	GestureResponderEvent,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	TouchableWithoutFeedback,
	View
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import uuid from "react-native-uuid";

type InventoryItem = {
	id: string;
	name: string;
	quantity: number;
	price: number;
	description?: string;
	updatedAt: string;
};

type Organization = {
	id: string;
	name: string;
	currency: string;
	createdAt: string;
	inventory: InventoryItem[];
};

export default function InventoryScreen() {
	const { orgId } = useLocalSearchParams<{ orgId: string }>();
	const [inventory, setInventory] = useState<InventoryItem[]>([]);
	const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
	const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
	const [optionsVisible, setOptionsVisible] = useState(false);
	const [optionsPosition, setOptionsPosition] = useState({ x: 0, y: 0 });
	const [currency, setCurrency] = useState("USD");

	const [name, setName] = useState("");
	const [quantity, setQuantity] = useState("");
	const [price, setPrice] = useState("");
	const [description, setDescription] = useState("");
	const inputRef = useRef<TextInput>(null);

	// Fetch organization inventory
	const fetchInventory = async () => {
		const data = await AsyncStorage.getItem("organizations");
		if (!data) return;
		const orgs: Organization[] = JSON.parse(data);
		const org = orgs.find((o) => o.id === orgId);
		if (!org) return;
		setInventory(org.inventory || []);
		setCurrency(org.currency || "USD");
	};

	// Update AsyncStorage
	const updateInventory = async (items: InventoryItem[]) => {
		const data = await AsyncStorage.getItem("organizations");
		if (!data) return;
		const orgs: Organization[] = JSON.parse(data);
		const updated = orgs.map((org) =>
			org.id === orgId ? { ...org, inventory: items } : org
		);
		await AsyncStorage.setItem("organizations", JSON.stringify(updated));
		setInventory(items);
	};

	// Handle create/update item
	const handleSaveItem = async () => {
		if (!name || !quantity || !price) {
			Alert.alert("Error", "Please fill all fields.");
			return;
		}
		const item: InventoryItem = {
			id: editingItem?.id ?? uuid.v4().toString(),
			name,
			quantity: parseInt(quantity),
			price: parseFloat(price),
			description,
			updatedAt: new Date().toISOString(),
		};

		const updated = editingItem
			? inventory.map((i) => (i.id === editingItem.id ? item : i))
			: [...inventory, item];

		await updateInventory(updated);
		resetForm();
	};

	const handleDeleteItem = async () => {
		if (!selectedItem) return;
		const updated = inventory.filter((i) => i.id !== selectedItem.id);
		await updateInventory(updated);
		setOptionsVisible(false);
		setSelectedItem(null);
	};

	const handleQtyChange = async (id: string, delta: number) => {
		const updated = inventory.map((item) =>
			item.id === id
				? { ...item, quantity: Math.max(0, item.quantity + delta) }
				: item
		);
		await updateInventory(updated);
	};

	const resetForm = () => {
		setName("");
		setQuantity("");
		setPrice("");
		setDescription("");
		setEditingItem(null);
	};

	const handleLongPress = (e: GestureResponderEvent, item: InventoryItem) => {
		setSelectedItem(item);
		setOptionsPosition({ x: e.nativeEvent.pageX, y: e.nativeEvent.pageY });
		setOptionsVisible(true);
	};

	useEffect(() => void fetchInventory(), []);
	useEffect(() => {
		if (editingItem) {
			setName(editingItem.name);
			setQuantity(editingItem.quantity.toString());
			setPrice(editingItem.price.toString());
			setDescription(editingItem.description || "");
		}
	}, [editingItem]);

	useEffect(() => {
		if (editingItem) setTimeout(() => inputRef.current?.focus(), 200);
	}, [editingItem]);

	return (
		<SafeAreaProvider>
			<TouchableWithoutFeedback>
				<SafeAreaView className="flex-1 bg-neutral-900">
					{/* Options Modal */}
					{optionsVisible && (
						<View
							className="absolute bg-neutral-700 p-4 rounded-full z-30 shadow-sm"
							style={{
								top: optionsPosition.y - 150,
								left: optionsPosition.x - 200,
							}}
						>
							<View className="flex-row gap-4 items-center">
								<Pressable
									className="bg-blue-500 rounded-full px-4 py-2"
									onPress={() => {
										setOptionsVisible(false);
										if (selectedItem) setEditingItem(selectedItem);
									}}
								>
									<Text className="text-white">Edit</Text>
								</Pressable>

								<Pressable
									className="py-2 px-4"
									onPress={() => {
										Alert.alert("Delete Item", "Are you sure?", [
											{ text: "Cancel", style: "cancel" },
											{ text: "Delete", style: "destructive", onPress: handleDeleteItem },
										]);
									}}
								>
									<Text className="text-white">Delete</Text>
								</Pressable>

								<Pressable
									onPress={() => setOptionsVisible(false)}
									className="p-4 bg-neutral-800 rounded-full"
								>
									<FontAwesome6 name="xmark" color="#fafafa" />
								</Pressable>
							</View>
						</View>
					)}

					{/* Add/Edit Modal */}
					{editingItem !== null && (
						<View className="absolute top-1/4 left-[5%] w-[90%] bg-neutral-800 p-6 rounded-lg z-20">
							<View className="gap-4">
								<TextInput
									ref={inputRef}
									placeholder="Item name"
									value={name}
									onChangeText={setName}
									className="bg-neutral-700 text-neutral-50 px-4 rounded-sm placeholder:text-neutral-50"
								/>
								<TextInput
									placeholder="Quantity"
									keyboardType="numeric"
									value={quantity}
									onChangeText={setQuantity}
									className="bg-neutral-700 text-neutral-50 px-4 rounded-sm placeholder:text-neutral-50"
								/>
								<TextInput
									placeholder="Price"
									keyboardType="decimal-pad"
									value={price}
									onChangeText={setPrice}
									className="bg-neutral-700 text-neutral-50 px-4 rounded-sm placeholder:text-neutral-50"
								/>
								<TextInput
									placeholder="Description (optional)"
									value={description}
									onChangeText={setDescription}
									className="bg-neutral-700 text-neutral-50 px-4 rounded-sm placeholder:text-neutral-50"
								/>
							</View>
							<View className="flex-row justify-between mt-6">
								<Pressable
									onPress={handleSaveItem}
									className="bg-blue-500 px-4 py-2 rounded-lg"
								>
									<Text className="text-white">{editingItem ? "Save Changes" : "Add Item"}</Text>
								</Pressable>
								<Pressable
									onPress={() => {
										resetForm();
										setEditingItem(null);
									}}
									className="px-4 py-2"
								>
									<Text className="text-neutral-300 underline">Cancel</Text>
								</Pressable>
							</View>
						</View>
					)}

					{/* FAB */}
					<Pressable
						onPress={() => {
							resetForm();
							setEditingItem({} as InventoryItem);
						}}
						className="absolute bottom-8 right-8 bg-blue-500 rounded-xl p-4"
					>
						<FontAwesome6 name="plus" color="#fafafa" size={24} />
					</Pressable>

					{/* Inventory List */}
					<ScrollView className="flex-1 px-4 py-6">
						<Text className="text-neutral-50 text-xl font-bold mb-4">Inventory</Text>

						{inventory.length === 0 ? (
							<Text className="text-neutral-400">No items yet...</Text>
						) : (
							inventory.map((item) => (
								<Pressable
									key={item.id}
									onLongPress={(e) => handleLongPress(e, item)}
									className="bg-neutral-800 p-4 mb-4 rounded-lg flex-row items-center justify-between"
								>
									<View className="gap-1 max-w-[90%]">
										<Text className="text-white font-semibold">{item.name}</Text>
										<Text className="text-neutral-300 text-sm">Price: {item.price} {currency}  /  Qty: {item.quantity}x</Text>
										{item.description && (
											<Text className="text-neutral-300 text-xs">Description: {item.description}</Text>
										)}
									</View>

									<View className="flex-col">
										<Pressable
											onPress={() => handleQtyChange(item.id, +1)}
											className="p-2 bg-blue-500 rounded-t"
										>
											<FontAwesome6 name="plus" color="#fff" />
										</Pressable>
										<Pressable
											onPress={() => handleQtyChange(item.id, -1)}
											className="p-2 bg-neutral-700 rounded-b"
										>
											<FontAwesome6 name="minus" color="#fff" />
										</Pressable>
									</View>
								</Pressable>
							))
						)}
					</ScrollView>
				</SafeAreaView>
			</TouchableWithoutFeedback>
		</SafeAreaProvider>
	);
}
