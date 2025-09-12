from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
import logging
from .serializers import UserRegistrationSerializer, LoginSerializer, UserSerializer
from .models import User

logger = logging.getLogger('cardiovascular.authentication')

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Vista para autenticación de usuarios"""
    
    logger.info(f"Intento de login desde IP: {request.META.get('REMOTE_ADDR')}")
    
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        logger.warning(f"Errores de validación en login: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = serializer.validated_data['user']
        logger.info(f"Usuario autenticado exitosamente: {user.email}")
        
        refresh = RefreshToken.for_user(user)
        user_data = UserSerializer(user).data

        return Response({
            'user': user_data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })
    except Exception as e:
        logger.error(f"Error en login_view: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Error en la autenticación'},
            status=status.HTTP_401_UNAUTHORIZED
        )

@api_view(['POST'])
def logout_view(request):
    """Vista para cerrar sesión"""
    try:
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            logger.warning("Intento de logout sin token refresh")
            return Response({'error': 'Token refresh requerido'}, status=status.HTTP_400_BAD_REQUEST)
        
        token = RefreshToken(refresh_token)
        token.blacklist()
        
        logger.info(f"Usuario {request.user.email if hasattr(request, 'user') else 'UNKNOWN'} cerró sesión exitosamente")
        return Response({'message': 'Logout exitoso'}, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error en logout_view: {str(e)}")
        return Response({'error': 'Token inválido'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def profile_view(request):
    """Vista para obtener perfil de usuario"""
    try:
        serializer = UserSerializer(request.user)
        logger.info(f"Perfil consultado por usuario: {request.user.email}")
        return Response(serializer.data)
    except Exception as e:
        logger.error(f"Error en profile_view: {str(e)}")
        return Response({'error': 'Error obteniendo perfil'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
