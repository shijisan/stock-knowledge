import "@/global.css";
import { FontAwesome6 } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, GestureResponderEvent, Keyboard, Pressable, Text, TextInput, TouchableWithoutFeedback, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import uuid from 'react-native-uuid';


type Organization = {
	id: string;
	name: string;
	createdAt: string;
	inventory: InventoryItem[];
};

type InventoryItem = {
	id: string;
	name: string;
	quantity: number;
	price: number;
	description?: string;
	updatedAt: string;
};

export default function App() {

	const [organizations, setOrganizations] = useState<Organization[]>([]);
	const [toggleCreateModal, setToggleCreateModal] = useState(false);
	const [newOrgName, setNewOrgName] = useState("");
	const [selectedItem, setSelectedItem] = useState<string | null>(null);
	const [optionsPosition, setOptionsPosition] = useState({ x: 0, y: 0 });
	const [toggleOptions, setToggleOptions] = useState(false);
	const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
	const [editName, setEditName] = useState("");

	const newOrgInputRef = useRef<TextInput>(null);
	const editOrgInputRef = useRef<TextInput>(null);

	const router = useRouter();

	const fetchData = async () => {
		const data = await AsyncStorage.getItem('organizations');
		if (data) {
			const parsed = JSON.parse(data)
			setOrganizations([...parsed]);
		}
		else {
			setOrganizations([]);
		}
	}

	const handleCreateOrg = async (newOrgName: string) => {
		if (newOrgName.trim().length === 0) {
			Alert.alert("Error", "Must set an organization name!");
			return;
		}

		const newOrg: Organization = {
			id: uuid.v4().toString(),
			name: newOrgName,
			createdAt: new Date().toISOString(),
			inventory: [],
		};

		try {
			const existing = await AsyncStorage.getItem('organizations');
			const orgs: Organization[] = existing ? JSON.parse(existing) : [];

			orgs.push(newOrg);

			await AsyncStorage.setItem('organizations', JSON.stringify(orgs));

			fetchData();
			setNewOrgName("");
			setToggleCreateModal(false);

		} catch (err) {
			console.error("Failed to create organization", err);
			Alert.alert("Error", "Failed to save organization");
		}
	}

	const handleLongPress = (e: GestureResponderEvent, itemId: string) => {
		const { pageX, pageY } = e.nativeEvent;
		setSelectedItem(itemId);
		setOptionsPosition({ x: pageX, y: pageY });
		setToggleOptions(true);
	}

	const handleEditOrg = async () => {
		if (!editingOrg || editName.trim().length === 0) return;
		const updated = organizations.map(org =>
			org.id === editingOrg.id ? { ...org, name: editName } : org
		);

		await AsyncStorage.setItem('organizations', JSON.stringify(updated));
		setOrganizations(updated);
		setEditingOrg(null);
		setToggleOptions(false);
	}

	const handleDeleteOrg = async () => {
		if (!selectedItem) return;

		const filtered = organizations.filter(org => org.id !== selectedItem);
		await AsyncStorage.setItem('organizations', JSON.stringify(filtered));
		setOrganizations(filtered);
		setToggleOptions(false);
	}

	useEffect(() => {
		fetchData();
	}, []);

	useEffect(() => {
		if (toggleCreateModal) {
			setTimeout(() => newOrgInputRef.current?.focus(), 200);
		}
	}, [toggleCreateModal]);

	useEffect(() => {
		if (editingOrg) {
			setEditName(editingOrg.name);
			setTimeout(() => editOrgInputRef.current?.focus(), 200);
		}
	}, [editingOrg]);

	return (
		<>
			<SafeAreaProvider>
				<TouchableWithoutFeedback className="flex-1">
					<SafeAreaView className="flex-1 bg-neutral-900 pt-8">
						
						{toggleOptions && (
							<View
								className="absolute bg-neutral-700 p-4 rounded-full z-30 elevation-lg shadow-sm flex flex-col gap-6"
								style={{
									top: optionsPosition.y - 150,
									left: optionsPosition.x - 175,
								}}
							>
								<View className="flex flex-row gap-4 items-center">
									<Pressable className="bg-blue-500 rounded-full active:opacity-75 px-4 py-2" onPress={() => {
										setToggleOptions(false);
										const found = organizations.find(org => org.id === selectedItem);
										if (found) setEditingOrg(found);
									}}>
										<Text className="text-white">Edit</Text>
									</Pressable>

									<Pressable className="py-2 px-4" onPress={() => {
										Keyboard.dismiss();
										Alert.alert(
											"Delete Organization",
											"Are you sure you want to delete this organization?",
											[
												{ text: "Cancel", style: "cancel" },
												{ text: "Delete", style: "destructive", onPress: handleDeleteOrg }
											]
										);
									}}>
										<Text className="text-white active:underline" suppressHighlighting={true} >Delete</Text>
									</Pressable>

									<Pressable onPress={() => setToggleOptions(false)} className="p-4 rounded-full bg-neutral-800 aspect-square flex items-center justify-center overflow-visible">
										<FontAwesome6 name="xmark" color="#fafafa" style={{ marginBottom: -1 }} />
									</Pressable>
								</View>
							</View>
						)}

						
						<View className={`rounded-lg py-8 px-4 ${toggleCreateModal ? "block" : "hidden"} absolute top-1/4 left-[5%] w-[90%] bg-neutral-800 flex flex-col gap-8 z-10`}>
							<View className="flex flex-col gap-4">
								<TextInput
									ref={newOrgInputRef}
									className="bg-neutral-700 placeholder:text-neutral-300 text-neutral-50 px-4 rounded-sm"
									placeholder="Organization name"
									onChangeText={setNewOrgName}
									value={newOrgName}
								/>
								<View className="ps-2 flex flex-row gap-2 w-[90%]">
									<FontAwesome6 name="circle-question" size={12} color="#a3a3a3" />
									<Text className="text-xs text-neutral-400">Organizations contain the inventories and products.</Text>
								</View>
							</View>
							<View className="flex flex-row justify-between gap-4">
								<Pressable onPress={() => handleCreateOrg(newOrgName)} className="rounded-lg bg-blue-500 px-4 py-2 active:opacity-75 self-start">
									<Text className="text-neutral-50">Create Organization</Text>
								</Pressable>
								<Pressable onPress={() => { Keyboard.dismiss(); setToggleCreateModal(false); setNewOrgName(""); }} className="px-4 py-2 self-start">
									<Text className="text-neutral-200 active:underline" suppressHighlighting={true} >Cancel</Text>
								</Pressable>
							</View>
						</View>

						
						{editingOrg && (
							<View className={`rounded-lg py-8 px-4 absolute top-1/4 left-[5%] w-[90%] bg-neutral-800 flex flex-col gap-8 z-10`}>
								<View className="flex flex-col gap-4">
									<TextInput
										ref={editOrgInputRef}
										className="bg-neutral-700 placeholder:text-neutral-300 text-neutral-50 px-4 rounded-sm"
										placeholder="Edit organization name"
										onChangeText={setEditName}
										value={editName}
									/>
									<View className="ps-2 flex flex-row gap-2 w-[90%]">
										<FontAwesome6 name="circle-question" size={12} color="#a3a3a3" />
										<Text className="text-xs text-neutral-400">Editing organization name.</Text>
									</View>
								</View>
								<View className="flex flex-row justify-between gap-4">
									<Pressable onPress={handleEditOrg} className="rounded-lg bg-blue-500 px-4 py-2 active:opacity-75 self-start">
										<Text className="text-neutral-50">Save Changes</Text>
									</Pressable>
									<Pressable onPress={() => setEditingOrg(null)} className="px-4 py-2 self-start">
										<Text className="text-neutral-200 active:underline">Cancel</Text>
									</Pressable>
								</View>
							</View>
						)}

						
						<Pressable onPress={() => setToggleCreateModal(true)} className="rounded-xl bg-blue-500 px-4 py-2 active:opacity-75 self-start ml-4 mt-4 aspect-square size-16 absolute bottom-8 right-8 justify-center items-center">
							<FontAwesome6 name="plus" color="#fafafa" size={24} />
						</Pressable>

						
						<View className={`flex-1 flex flex-col ${organizations.length === 0 ? "items-center justify-center" : "items-start justify-start"}`}>
							<Text className="text-neutral-50 text-xl font-bold mb-4 ms-4">Organizations</Text>
							<View className="flex flex-col gap-4 w-full px-4">
								{organizations.length === 0 ? (
									<Text className="text-neutral-50">No organizations yet...</Text>
								) : (
									organizations.map((item, index) => (
										<Pressable onPress={() => router.push({pathname: "/organizations/[orgId]/screen", params: {orgId: item.id}})} key={item.id ?? index} onLongPress={(e) => handleLongPress(e, item.id)} className="p-6 active:bg-neutral-50/10 w-full bg-neutral-800/50 rounded-lg">
											<Text className="text-neutral-50">{item.name}</Text>
										</Pressable>
									))
								)}
							</View>
						</View>
					</SafeAreaView>
				</TouchableWithoutFeedback>
			</SafeAreaProvider>
		</>
	);
}
