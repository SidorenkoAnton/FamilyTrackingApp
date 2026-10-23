import React, { useState } from 'react';
import { View } from 'react-native';
import { groupsApi } from '../api';
import {
  AppButton,
  AppInput,
  AppText,
  InlineBanner,
  Screen,
  useToast,
} from '../components/ui';
import { spacing } from '../design/tokens';
import type { GroupsScreenProps } from '../navigation/types';
import { getErrorMessage } from '../utils/errors';
import { validateGroupName } from '../utils/validation';

export function CreateGroupScreen({ navigation }: GroupsScreenProps<'CreateGroup'>) {
  const toast = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    const error = validateGroupName(name);
    if (error) {
      setNameError(error);
      return;
    }

    setNameError(null);
    setFormError(null);
    setSubmitting(true);

    try {
      await groupsApi.create({
        name: name.trim(),
        ...(description.trim() ? { description: description.trim() } : {}),
      });
      toast.show('Группа создана');
      navigation.goBack();
    } catch (createError) {
      setFormError(getErrorMessage(createError, 'Не удалось создать группу'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen
      scroll
      edges={['bottom']}
      padded
      avoidKeyboard
      footer={
        <AppButton
          label="Создать группу"
          large
          onPress={handleCreate}
          loading={submitting}
        />
      }
    >
      <View style={{ gap: spacing.lg }}>
        <AppText variant="body" tone="textSecondary">
          Группа объединяет вашу семью: участники видят друг друга на общей карте.
          После создания вы сможете пригласить их по коду.
        </AppText>

        <AppInput
          label="Название"
          value={name}
          onChangeText={(value) => {
            setName(value);
            if (nameError) setNameError(null);
          }}
          placeholder="Например, «Семья Ивановых»"
          autoFocus
          returnKeyType="next"
          editable={!submitting}
          errorText={nameError}
          maxLength={60}
        />

        <AppInput
          label="Описание (необязательно)"
          value={description}
          onChangeText={setDescription}
          placeholder="Коротко о группе"
          multiline
          numberOfLines={3}
          maxLength={200}
          editable={!submitting}
          style={{ minHeight: 96 }}
        />

        {formError ? <InlineBanner message={formError} tone="danger" /> : null}
      </View>
    </Screen>
  );
}
