import { useRouter } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export default function Home() {

  const router = useRouter();

  return (
    <>
      <SafeAreaProvider>
        <SafeAreaView className='bg-neutral-900 flex-1'>
          <View className="flex-1 items-center justify-center gap-8">
            <View className="rounded-xl bg-blue-500 self-center p-4">
              <Image
                source={require('@/assets/images/icon.png')}
                className="size-32"
                resizeMode='contain'
              />
            </View>
            <View className='gap-4'>


              <Text className="text-neutral-50 text-4xl font-bold text-center">Stock Knowledge</Text>
              <Text className="text-neutral-300 max-w-sm text-center">This is a simple React Native App with NativeWind that let&apos;s you manage your product inventory in your mobile devices.</Text>
            </View>

            <Pressable onPress={() => router.push("/organizations/screen")} className='rounded-lg bg-blue-500 px-4 py-2 active:opacity-75'>
              <Text className='text-neutral-50'>Launch App</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>

    </>
  )
}