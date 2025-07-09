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

const initialFormState = {
	name: "",
	quantity: "",
	price: "",
	description: "",
};

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
	const [modalVisible, setModalVisible] = useState(false);
	const [toggleOptions, setToggleOptions] = useState(false);
	const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
	const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
	const [optionsPosition, setOptionsPosition] = useState({ x: 0, y: 0 });
	const [currency, setCurrency] = useState("USD");

	const [form, setForm] = useState(initialFormState);
	const inputRef = useRef<TextInput>(null);

	const fetchInventory = async () => {
		const orgsStr = await AsyncStorage.getItem("organizations");
		if (!orgsStr) return;

		const orgs: Organization[] = JSON.parse(orgsStr);
		const selectedOrg = orgs.find((org) => org.id === orgId);
		if (!selectedOrg) return;

		setInventory(selectedOrg.inventory || []);
		setCurrency(selectedOrg.currency || "USD");
	};

	const updateStorage = async (newInventory: InventoryItem[]) => {
		const orgsStr = await AsyncStorage.getItem("organizations");
		if (!orgsStr) return;

		const orgs: Organization[] = JSON.parse(orgsStr);
		const updatedOrgs = orgs.map((org) =>
			org.id === orgId ? { ...org, inventory: newInventory } : org
		);
		await AsyncStorage.setItem("organizations", JSON.stringify(updatedOrgs));
		setInventory(newInventory);
	};

	const resetForm = () => setForm(initialFormState);

	const handleCreateOrEditItem = async () => {
		const { name, quantity, price, description } = form;
		if (!orgId || !name || !quantity || !price) {
			Alert.alert("Error", "Please fill all required fields.");
			return;
		}

		const newItem: InventoryItem = {
			id: editingItem?.id ?? uuid.v4().toString(),
			name,
			quantity: parseInt(quantity),
			price: parseFloat(price),
			description,
			updatedAt: new Date().toISOString(),
		};

		const updatedInv = editingItem
			? inventory.map((item) => (item.id === editingItem.id ? newItem : item))
			: [...inventory, newItem];

		await updateStorage(updatedInv);
		setEditingItem(null);
		setModalVisible(false);
		resetForm();
	};

	const handleDeleteItem = async () => {
		if (!selectedItem) return;
		const filtered = inventory.filter((item) => item.id !== selectedItem.id);
		await updateStorage(filtered);
		setToggleOptions(false);
		setSelectedItem(null);
	};

	const handleQuantityChange = async (itemId: string, delta: number) => {
		const updatedInv = inventory.map((item) =>
			item.id === itemId
				? { ...item, quantity: Math.max(0, item.quantity + delta) }
				: item
		);

		await updateStorage(updatedInv);
		await fetchInventory();
	};

	const handleLongPress = (e: GestureResponderEvent, item: InventoryItem) => {
		const { pageX, pageY } = e.nativeEvent;
		setSelectedItem(item);
		setOptionsPosition({ x: pageX, y: pageY });
		setToggleOptions(true);
	};

	useEffect(() => {
		fetchInventory();
	}, []);

	useEffect(() => {
		if (modalVisible) {
			setTimeout(() => inputRef.current?.focus(), 200);
		}
	}, [modalVisible]);

	useEffect(() => {
		if (editingItem) {
			setForm({
				name: editingItem.name,
				quantity: editingItem.quantity.toString(),
				price: editingItem.price.toString(),
				description: editingItem.description || "",
			});
			setModalVisible(true);
		}
	}, [editingItem]);

	return (
		<SafeAreaProvider>
			<TouchableWithoutFeedback>
				<SafeAreaView className="flex-1 bg-neutral-900">
					{toggleOptions && (
						<View
							className="absolute bg-neutral-700 p-4 rounded-full z-30 elevation-lg shadow-sm flex flex-col gap-6"
							style={{ top: optionsPosition.y - 150, left: optionsPosition.x - 200 }}
						>
							<View className="flex flex-row gap-4 items-center">
								<Pressable
									onPress={() => {
										setToggleOptions(false);
										if (selectedItem) setEditingItem(selectedItem);
									}}
									className="bg-blue-500 rounded-full active:opacity-75 px-4 py-2"
								>
									<Text className="text-white">Edit</Text>
								</Pressable>
								<Pressable
									onPress={() => Alert.alert("Delete Item", "Are you sure?", [
										{ text: "Cancel", style: "cancel" },
										{ text: "Delete", style: "destructive", onPress: handleDeleteItem },
									])}
									className="py-2 px-4"
								>
									<Text className="text-white active:underline">Delete</Text>
								</Pressable>
								<Pressable onPress={() => setToggleOptions(false)} className="p-4 rounded-full bg-neutral-800">
									<FontAwesome6 name="xmark" color="#fafafa" />
								</Pressable>
							</View>
						</View>
					)}

					{modalVisible && (
						<View className="rounded-lg py-8 px-4 absolute top-1/4 left-[5%] w-[90%] bg-neutral-800 flex flex-col gap-8 z-10">
							<View className="flex flex-col gap-4">
								{Object.entries(form).map(([key, val]) => (
									<TextInput
										key={key}
										ref={key === "name" ? inputRef : undefined}
										className="bg-neutral-700 placeholder:text-neutral-300 text-neutral-50 px-4 rounded-sm"
										placeholder={
											key === "description" ? "Description (optional)" : key.charAt(0).toUpperCase() + key.slice(1)
										}
										keyboardType={key === "price" || key === "quantity" ? "decimal-pad" : "default"}
										value={form[key as keyof typeof form]}
										onChangeText={(text) => setForm((f) => ({ ...f, [key]: text }))}
									/>
								))}
							</View>
							<View className="flex flex-row justify-between gap-4">
								<Pressable onPress={handleCreateOrEditItem} className="rounded-lg bg-blue-500 px-4 py-2 active:opacity-75">
									<Text className="text-neutral-50">{editingItem ? "Save Changes" : "Add Item"}</Text>
								</Pressable>
								<Pressable onPress={() => { setModalVisible(false); setEditingItem(null); resetForm(); }} className="px-4 py-2">
									<Text className="text-neutral-200 active:underline">Cancel</Text>
								</Pressable>
							</View>
						</View>
					)}

					<Pressable onPress={() => { setModalVisible(true); setEditingItem(null); }} className="rounded-xl bg-blue-500 px-4 py-2 active:opacity-75 self-start ml-4 mt-4 aspect-square size-16 absolute bottom-8 right-8 justify-center items-center z-30 elevation-lg">
						<FontAwesome6 name="plus" color="#fafafa" size={24} />
					</Pressable>

					<ScrollView className="flex-1 px-4 py-6">
						<Text className="text-neutral-50 text-xl font-bold mb-4">Inventory</Text>
						{inventory.length === 0 ? (
							<Text className="text-neutral-400">No inventory items yet...</Text>
						) : (
							inventory.map((item) => (
								<Pressable key={item.id} onLongPress={(e) => handleLongPress(e, item)} className="bg-neutral-800 p-4 mb-4 rounded-lg shadow-md active:bg-neutral-50/10 flex flex-row items-center">
									<View className="flex flex-col flex-grow gap-2">
										<Text className="text-neutral-50 font-semibold">{item.name}</Text>
										<Text className="text-neutral-300 text-sm">Price ({currency}): {item.price}  /  Qty: {item.quantity}</Text>
										<Text className="text-neutral-300 text-xs">Description: {item.description}</Text>
									</View>
									<View className="flex flex-row gap-6 items-center z-10 elevation-sm">
										<View className="flex flex-col gap-2">
											<Text className="text-neutral-300 text-sm"></Text>
										</View>
										<View className="flex flex-col z-40 elevation-xl">
											<Pressable
												onPress={() => handleQuantityChange(item.id, 1)}
												className="p-2 bg-blue-500 rounded-t-sm"
											>
												<FontAwesome6 name="plus" color="#fafafa" />
											</Pressable>
											<Pressable
												onPress={() => handleQuantityChange(item.id, -1)}
												className="p-2 bg-neutral-700 rounded-b-sm active:brightness-110"
											>
												<FontAwesome6 name="minus" color="#fafafa" />
											</Pressable>
										</View>

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