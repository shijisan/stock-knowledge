import "@/global.css";
import { FontAwesome6 } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import currencyCodes from 'currency-codes';
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, GestureResponderEvent, Keyboard, Pressable, Text, TextInput, TouchableWithoutFeedback, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import uuid from 'react-native-uuid';

type Organization = {
	id: string;
	name: string;
	currency: string;
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
	const [toggleOrgModal, setToggleOrgModal] = useState(false);
	const [orgName, setOrgName] = useState("");
	const [selectedCurrency, setSelectedCurrency] = useState("USD");
	const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
	const [selectedItem, setSelectedItem] = useState<string | null>(null);
	const [optionsPosition, setOptionsPosition] = useState({ x: 0, y: 0 });
	const [toggleOptions, setToggleOptions] = useState(false);
	const orgInputRef = useRef<TextInput>(null);

	const router = useRouter();
	const currencies = currencyCodes.data.map(c => c.code);

	const fetchData = async () => {
		const data = await AsyncStorage.getItem('organizations');
		setOrganizations(data ? JSON.parse(data) : []);
	};

	const handleSaveOrg = async () => {
		if (orgName.trim() === "") {
			Alert.alert("Error", "Must set an organization name!");
			return;
		}

		const existingData = await AsyncStorage.getItem('organizations');
		const orgs: Organization[] = existingData ? JSON.parse(existingData) : [];

		let updatedOrgs;

		if (editingOrg) {
			// Edit existing
			updatedOrgs = orgs.map((org) =>
				org.id === editingOrg.id ? { ...org, name: orgName, currency: selectedCurrency } : org
			);
		} else {
			// Create new
			const newOrg: Organization = {
				id: uuid.v4().toString(),
				name: orgName,
				currency: selectedCurrency,
				createdAt: new Date().toISOString(),
				inventory: [],
			};
			updatedOrgs = [...orgs, newOrg];
		}

		await AsyncStorage.setItem('organizations', JSON.stringify(updatedOrgs));
		fetchData();
		closeModal();
	};

	const handleDeleteOrg = async () => {
		if (!selectedItem) return;
		const filtered = organizations.filter(org => org.id !== selectedItem);
		await AsyncStorage.setItem('organizations', JSON.stringify(filtered));
		setOrganizations(filtered);
		setToggleOptions(false);
	};

	const handleLongPress = (e: GestureResponderEvent, itemId: string) => {
		const { pageX, pageY } = e.nativeEvent;
		setSelectedItem(itemId);
		setOptionsPosition({ x: pageX, y: pageY });
		setToggleOptions(true);
	};

	const openModalForCreate = () => {
		setEditingOrg(null);
		setOrgName("");
		setSelectedCurrency("USD");
		setToggleOrgModal(true);
	};

	const openModalForEdit = (org: Organization) => {
		setEditingOrg(org);
		setOrgName(org.name);
		setSelectedCurrency(org.currency);
		setToggleOrgModal(true);
	};

	const closeModal = () => {
		setEditingOrg(null);
		setOrgName("");
		setSelectedCurrency("USD");
		setToggleOrgModal(false);
	};

	useEffect(() => {
		fetchData();
	}, []);

	useEffect(() => {
		if (toggleOrgModal) {
			setTimeout(() => orgInputRef.current?.focus(), 200);
		}
	}, [toggleOrgModal]);

	return (
		<SafeAreaProvider>
			<TouchableWithoutFeedback>
				<SafeAreaView className="flex-1 bg-neutral-900 pt-8">

					{/* OPTIONS POPOVER */}
					{toggleOptions && (
						<View
							className="absolute bg-neutral-700 p-4 rounded-full z-30 elevation-lg shadow-sm flex flex-col gap-6"
							style={{ top: optionsPosition.y - 150, left: optionsPosition.x - 175 }}
						>
							<View className="flex flex-row gap-4 items-center">
								<Pressable className="bg-blue-500 rounded-full active:opacity-75 px-4 py-2" onPress={() => {
									setToggleOptions(false);
									const found = organizations.find(org => org.id === selectedItem);
									if (found) openModalForEdit(found);
								}}>
									<Text className="text-white">Edit</Text>
								</Pressable>
								<Pressable className="py-2 px-4" onPress={() => {
									Keyboard.dismiss();
									Alert.alert("Delete Organization", "Are you sure?", [
										{ text: "Cancel", style: "cancel" },
										{ text: "Delete", style: "destructive", onPress: handleDeleteOrg }
									]);
								}}>
									<Text className="text-white active:underline">Delete</Text>
								</Pressable>
								<Pressable onPress={() => setToggleOptions(false)} className="p-4 rounded-full bg-neutral-800">
									<FontAwesome6 name="xmark" color="#fafafa" />
								</Pressable>
							</View>
						</View>
					)}

					{/* CREATE/EDIT MODAL */}
					{toggleOrgModal && (
						<View className="absolute top-1/4 left-[5%] w-[90%] bg-neutral-800 rounded-lg py-8 px-4 z-10 flex flex-col gap-8">
							<View className="flex flex-col gap-4">
								<TextInput
									ref={orgInputRef}
									className="bg-neutral-700 placeholder:text-neutral-300 text-neutral-50 px-4 rounded-sm"
									placeholder="Organization name"
									value={orgName}
									onChangeText={setOrgName}
								/>
								<View className="flex flex-col gap-2">
									<Text className="text-neutral-300">Select Currency</Text>
									<View className="bg-neutral-700 rounded-md px-4">
										<Picker
											selectedValue={selectedCurrency}
											onValueChange={(val) => setSelectedCurrency(val)}
											style={{ color: "#fafafa" }}
										>
											{currencies.map(code => (
												<Picker.Item key={code} label={code} value={code} />
											))}
										</Picker>
									</View>
								</View>
								<View className="ps-2 flex flex-row gap-2 w-[90%]">
									<FontAwesome6 name="circle-question" size={12} color="#a3a3a3" />
									<Text className="text-xs text-neutral-400">Organizations contain the inventories and products.</Text>
								</View>
							</View>
							<View className="flex flex-row justify-between gap-4">
								<Pressable onPress={handleSaveOrg} className="rounded-lg bg-blue-500 px-4 py-2 active:opacity-75">
									<Text className="text-neutral-50">
										{editingOrg ? "Save Changes" : "Create Organization"}
									</Text>
								</Pressable>
								<Pressable onPress={closeModal} className="px-4 py-2">
									<Text className="text-neutral-200 active:underline">Cancel</Text>
								</Pressable>
							</View>
						</View>
					)}

					{/* FLOATING BUTTON */}
					<Pressable onPress={openModalForCreate} className="rounded-xl bg-blue-500 px-4 py-2 active:opacity-75 self-start ml-4 mt-4 aspect-square size-16 absolute bottom-8 right-8 justify-center items-center">
						<FontAwesome6 name="plus" color="#fafafa" size={24} />
					</Pressable>

					{/* ORGANIZATION LIST */}
					<View className="flex-1 flex flex-col items-start justify-start">
						<Text className="text-neutral-50 text-xl font-bold mb-4 ms-4">Organizations</Text>
						<View className="flex flex-col gap-4 w-full px-4">
							{organizations.length === 0 ? (
								<Text className="text-neutral-50">No organizations yet...</Text>
							) : (
								organizations.map((item, index) => (
									<Pressable
										key={item.id ?? index}
										onPress={() => router.push({ pathname: "/organizations/[orgId]/screen", params: { orgId: item.id } })}
										onLongPress={(e) => handleLongPress(e, item.id)}
										className="p-6 active:bg-neutral-50/10 w-full bg-neutral-800/50 rounded-lg"
									>
										<Text className="text-neutral-50">{item.name}</Text>
										<Text className="text-neutral-400 text-xs">{item.currency}</Text>
									</Pressable>
								))
							)}
						</View>
					</View>
				</SafeAreaView>
			</TouchableWithoutFeedback>
		</SafeAreaProvider>
	);
}
