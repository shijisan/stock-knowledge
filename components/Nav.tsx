import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, View } from "react-native";

export default function Nav() {
   const router = useRouter();

   return (
      <View className='w-full bg-neutral-800 absolute top-0 left-0 px-3 pt-16 pb-2 justify-center shadow-md'>
         <Pressable
            onPress={() => router.back()}
            className="self-start aspect-square py-2"
         >
            <FontAwesome6 name="arrow-left-long" size={24} color="#fafafa" />
         </Pressable>
      </View>
   );
}
