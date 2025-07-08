import Nav from '@/components/Nav';
import { Stack, usePathname } from 'expo-router';
import { View } from 'react-native';

export default function Layout() {

  const pathname = usePathname();

  return (
    <View className={`flex-1 ${pathname !== "/" && "pt-[100px]"}`}>

      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />

      {pathname !== "/" && 
        <Nav />
      }

    </View>
  );
}
