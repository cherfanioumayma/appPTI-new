import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { AUDIO_CONFIG } from '../utils/constants';

class AudioService {
  constructor() {
    this.recording = null;
    this.sound = null;
    this.isRecording = false;
    this.audioUri = null;
  }

  // Demander les permissions audio
  async requestPermissions() {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission audio refusée');
      }
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la demande de permission audio:', error);
      return { success: false, error: error.message };
    }
  }

  // Configurer l'audio
  async configureAudio() {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false
      });
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la configuration audio:', error);
      return { success: false, error: error.message };
    }
  }

  // Démarrer l'enregistrement audio
  async startRecording() {
    try {
      // Vérifier les permissions
      const permissionResult = await this.requestPermissions();
      if (!permissionResult.success) {
        return permissionResult;
      }

      // Configurer l'audio
      const configResult = await this.configureAudio();
      if (!configResult.success) {
        return configResult;
      }

      // Créer un nouveau fichier d'enregistrement
      const recording = new Audio.Recording();
      await recording.prepareAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();

      this.recording = recording;
      this.isRecording = true;

      return { success: true };
    } catch (error) {
      console.error('Erreur lors du démarrage de l\'enregistrement:', error);
      return { success: false, error: error.message };
    }
  }

  // Arrêter l'enregistrement audio
  async stopRecording() {
    try {
      if (!this.recording || !this.isRecording) {
        return { success: false, error: 'Aucun enregistrement en cours' };
      }

      await this.recording.stopAndUnloadAsync();
      this.audioUri = this.recording.getURI();
      this.isRecording = false;

      return { success: true, uri: this.audioUri };
    } catch (error) {
      console.error('Erreur lors de l\'arrêt de l\'enregistrement:', error);
      return { success: false, error: error.message };
    }
  }

  // Lire un fichier audio
  async playAudio(uri) {
    try {
      if (this.sound) {
        await this.sound.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync({ uri });
      this.sound = sound;
      await sound.playAsync();

      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la lecture audio:', error);
      return { success: false, error: error.message };
    }
  }

  // Arrêter la lecture audio
  async stopAudio() {
    try {
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de l\'arrêt de la lecture:', error);
      return { success: false, error: error.message };
    }
  }

  // Obtenir les informations du fichier audio
  async getAudioInfo(uri) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      return {
        success: true,
        size: fileInfo.size,
        exists: fileInfo.exists,
        uri: fileInfo.uri
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des infos audio:', error);
      return { success: false, error: error.message };
    }
  }

  // Convertir l'audio en base64 pour l'envoi
  async audioToBase64(uri) {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64
      });
      return { success: true, base64 };
    } catch (error) {
      console.error('Erreur lors de la conversion en base64:', error);
      return { success: false, error: error.message };
    }
  }

  // Supprimer un fichier audio
  async deleteAudio(uri) {
    try {
      await FileSystem.deleteAsync(uri);
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier audio:', error);
      return { success: false, error: error.message };
    }
  }

  // Enregistrer un message audio court (pour les alertes)
  async recordAlertMessage(durationMs = 10000) {
    try {
      // Démarrer l'enregistrement
      const startResult = await this.startRecording();
      if (!startResult.success) {
        return startResult;
      }

      // Attendre la durée spécifiée
      await new Promise(resolve => setTimeout(resolve, durationMs));

      // Arrêter l'enregistrement
      const stopResult = await this.stopRecording();
      if (!stopResult.success) {
        return stopResult;
      }

      return { success: true, uri: stopResult.uri };
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du message d\'alerte:', error);
      return { success: false, error: error.message };
    }
  }

  // Vérifier si l'enregistrement est en cours
  isCurrentlyRecording() {
    return this.isRecording;
  }

  // Obtenir l'URI du dernier enregistrement
  getLastRecordingUri() {
    return this.audioUri;
  }

  // Nettoyer les ressources
  cleanup() {
    if (this.sound) {
      this.sound.unloadAsync();
      this.sound = null;
    }
    if (this.recording) {
      this.recording = null;
    }
    this.isRecording = false;
  }
}

// Instance singleton
const audioService = new AudioService();
export default audioService; 