import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { View } from "react-native";

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center gap-6 bg-background">
      <Text variant="h3">Landfall project</Text>
      <Button onPress={() => console.log("Button pressed")}>
        <Text>Press me</Text>
      </Button>
    </View>
  );
}
