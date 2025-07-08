import "@/global.css";
import { FontAwesome6 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
   Alert,
   GestureResponderEvent,
   Keyboard,
   Pressable,
   ScrollView,
   Text,
   TextInput,
   TouchableWithoutFeedback,
   View,
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
	createdAt: string;
	inventory: InventoryItem[];
};

export default function InventoryScreen() {
	const { orgId } = useLocalSearchParams<{ orgId: string }>();
	const [inventory, setInventory] = useState<InventoryItem[]>([]);
	const [toggleCreateModal, setToggleCreateModal] = useState(false);
	const [toggleOptions, setToggleOptions] = useState(false);
	const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
	const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
	const [optionsPosition, setOptionsPosition] = useState({ x: 0, y: 0 });

	const [newName, setNewName] = useState("");
	const [newQuantity, setNewQuantity] = useState("");
	const [newPrice, setNewPrice] = useState("");
	const [newDesc, setNewDesc] = useState("");
	const inputRef = useRef<TextInput>(null);

	const fetchInventory = async () => {
		const orgsStr = await AsyncStorage.getItem("organizations");
		if (!orgsStr) return;

		const orgs: Organization[] = JSON.parse(orgsStr);
		const selectedOrg = orgs.find((org) => org.id === orgId);
		if (!selectedOrg) return;

		setInventory(selectedOrg.inventory || []);
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

	const handleCreateInventoryItem = async () => {
		if (!orgId || newName.trim() === "" || newQuantity.trim() === "" || newPrice.trim() === "") {
			Alert.alert("Error", "Please fill all required fields.");
			return;
		}

		const newItem: InventoryItem = {
			id: uuid.v4().toString(),
			name: newName,
			quantity: parseInt(newQuantity),
			price: parseFloat(newPrice),
			description: newDesc,
			updatedAt: new Date().toISOString(),
		};

		const updatedInv = [...inventory, newItem];
		await updateStorage(updatedInv);
		setToggleCreateModal(false);
		resetForm();
	};

	const handleDeleteItem = async () => {
		if (!selectedItem) return;
		const filtered = inventory.filter((item) => item.id !== selectedItem.id);
		await updateStorage(filtered);
		setToggleOptions(false);
		setSelectedItem(null);
	};

	const handleEditItem = async () => {
		if (!editingItem || newName.trim() === "" || newQuantity.trim() === "" || newPrice.trim() === "")
			return;

		const updatedInv = inventory.map((item) =>
			item.id === editingItem.id
				? {
						...item,
						name: newName,
						quantity: parseInt(newQuantity),
						price: parseFloat(newPrice),
						description: newDesc,
						updatedAt: new Date().toISOString(),
				  }
				: item
		);

		await updateStorage(updatedInv);
		setEditingItem(null);
		resetForm();
	};

	const resetForm = () => {
		setNewName("");
		setNewQuantity("");
		setNewPrice("");
		setNewDesc("");
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
		if (toggleCreateModal || editingItem) {
			setTimeout(() => inputRef.current?.focus(), 200);
		}
	}, [toggleCreateModal, editingItem]);

	useEffect(() => {
		if (editingItem) {
			setNewName(editingItem.name);
			setNewQuantity(editingItem.quantity.toString());
			setNewPrice(editingItem.price.toString());
			setNewDesc(editingItem.description ?? "");
		}
	}, [editingItem]);

	return (
		<SafeAreaProvider>
			<TouchableWithoutFeedback>
				<SafeAreaView className="flex-1 bg-neutral-900">
					{toggleOptions && (
						<View
							className="absolute bg-neutral-700 p-4 rounded-full z-30 elevation-lg shadow-sm flex flex-col gap-6"
							style={{
								top: optionsPosition.y - 150,
								left: optionsPosition.x - 175,
							}}
						>
							<View className="flex flex-row gap-4 items-center">
								<Pressable
									className="bg-blue-500 rounded-full active:opacity-75 px-4 py-2"
									onPress={() => {
										setToggleOptions(false);
										if (selectedItem) setEditingItem(selectedItem);
									}}
								>
									<Text className="text-white">Edit</Text>
								</Pressable>

								<Pressable
									className="py-2 px-4"
									onPress={() => {
										Keyboard.dismiss();
										Alert.alert("Delete Item", "Are you sure?", [
											{ text: "Cancel", style: "cancel" },
											{ text: "Delete", style: "destructive", onPress: handleDeleteItem },
										]);
									}}
								>
									<Text className="text-white active:underline">Delete</Text>
								</Pressable>

								<Pressable
									onPress={() => setToggleOptions(false)}
									className="p-4 rounded-full bg-neutral-800 aspect-square flex items-center justify-center overflow-visible"
								>
									<FontAwesome6 name="xmark" color="#fafafa" style={{ marginBottom: -1 }} />
								</Pressable>
							</View>
						</View>
					)}

					{(toggleCreateModal || editingItem) && (
						<View className="rounded-lg py-8 px-4 absolute top-1/4 left-[5%] w-[90%] bg-neutral-800 flex flex-col gap-8 z-10">
							<View className="flex flex-col gap-4">
								<TextInput
									ref={inputRef}
									className="bg-neutral-700 placeholder:text-neutral-300 text-neutral-50 px-4 rounded-sm"
									placeholder="Item name"
									onChangeText={setNewName}
									value={newName}
								/>
								<TextInput
									className="bg-neutral-700 placeholder:text-neutral-300 text-neutral-50 px-4 rounded-sm"
									placeholder="Quantity"
									keyboardType="numeric"
									onChangeText={setNewQuantity}
									value={newQuantity}
								/>
								<TextInput
									className="bg-neutral-700 placeholder:text-neutral-300 text-neutral-50 px-4 rounded-sm"
									placeholder="Price"
									keyboardType="decimal-pad"
									onChangeText={setNewPrice}
									value={newPrice}
								/>
								<TextInput
									className="bg-neutral-700 placeholder:text-neutral-300 text-neutral-50 px-4 rounded-sm"
									placeholder="Description (optional)"
									onChangeText={setNewDesc}
									value={newDesc}
								/>
							</View>
							<View className="flex flex-row justify-between gap-4">
								<Pressable
									onPress={editingItem ? handleEditItem : handleCreateInventoryItem}
									className="rounded-lg bg-blue-500 px-4 py-2 active:opacity-75 self-start"
								>
									<Text className="text-neutral-50">
										{editingItem ? "Save Changes" : "Add Item"}
									</Text>
								</Pressable>
								<Pressable
									onPress={() => {
										Keyboard.dismiss();
										setToggleCreateModal(false);
										setEditingItem(null);
										resetForm();
									}}
									className="px-4 py-2 self-start"
								>
									<Text className="text-neutral-200 active:underline">Cancel</Text>
								</Pressable>
							</View>
						</View>
					)}

					<Pressable
						onPress={() => {
							setToggleCreateModal(true);
							setEditingItem(null);
						}}
						className="rounded-xl bg-blue-500 px-4 py-2 active:opacity-75 self-start ml-4 mt-4 aspect-square size-16 absolute bottom-8 right-8 justify-center items-center z-30 elevation-lg"
					>
						<FontAwesome6 name="plus" color="#fafafa" size={24} />
					</Pressable>

					<ScrollView className="flex-1 px-4 py-6">
						<Text className="text-neutral-50 text-xl font-bold mb-4">Inventory</Text>

						{inventory.length === 0 ? (
							<Text className="text-neutral-400">No inventory items yet...</Text>
						) : (
							inventory.map((item) => (
								<Pressable
									key={item.id}
									onLongPress={(e) => handleLongPress(e, item)}
									className="bg-neutral-800 p-4 mb-4 rounded-lg shadow-md active:bg-neutral-50/10"
								>
									<Text className="text-neutral-50 font-semibold">{item.name}</Text>
									<Text className="text-neutral-300 text-sm">
										Qty: {item.quantity} | ₱{item.price}
									</Text>
									{item.description && (
										<Text className="text-neutral-400 text-xs mt-1">
											{item.description}
										</Text>
									)}
								</Pressable>
							))
						)}
					</ScrollView>
				</SafeAreaView>
			</TouchableWithoutFeedback>
		</SafeAreaProvider>
	);
}
